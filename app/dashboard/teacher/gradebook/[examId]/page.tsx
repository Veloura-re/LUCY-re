"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Save, ArrowLeft, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertModal } from "@/components/ui/confirmation-modal";

export default function GradebookPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;

    const [exam, setExam] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [grades, setGrades] = useState<{ [studentId: string]: string }>({});
    const [attendance, setAttendance] = useState<{ [studentId: string]: string }>({});
    const [reasons, setReasons] = useState<{ [studentId: string]: string }>({});
    const [remarks, setRemarks] = useState<{ [studentId: string]: string }>({});
    const [statuses, setStatuses] = useState<{ [studentId: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, isOpen: boolean, variant?: "info" | "success" | "error" }>({ title: "", message: "", isOpen: false, variant: "info" });

    useEffect(() => {
        if (examId) fetchData();
    }, [examId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/teacher/grades?examId=${examId}`);
            const data = await res.json();

            if (data.exam) {
                setExam(data.exam);

                // Fetch students for this class
                const resStudents = await fetch(`/api/school/students`);
                const studentsData = await resStudents.json();
                if (studentsData.students) {
                    const classStudents = studentsData.students.filter((s: any) => s.classId === data.exam.classId);
                    setStudents(classStudents);
                }

                // Map existing grades
                if (data.graderecords) {
                    const gradeMap: any = {};
                    const remarkMap: any = {};
                    const statusMap: any = {};
                    data.graderecords.forEach((g: any) => {
                        gradeMap[g.studentId] = g.score.toString();
                        remarkMap[g.studentId] = g.remark || "";
                        statusMap[g.studentId] = g.status || "SUBMITTED";
                    });
                    setGrades(gradeMap);
                    setRemarks(remarkMap);
                    setStatuses(statusMap);
                }

                // Fetch existing attendance for this exam
                const resAtt = await fetch(`/api/teacher/attendance?examId=${examId}`);
                const attData = await resAtt.json();
                if (attData.records) {
                    const attMap: any = {};
                    const reasonMap: any = {};
                    attData.records.forEach((r: any) => {
                        attMap[r.studentId] = r.status;
                        reasonMap[r.studentId] = r.reason || "";
                    });
                    setAttendance(attMap);
                    setReasons(reasonMap);
                }
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const gradesToSubmit = Object.entries(grades).map(([studentId, score]) => ({
                studentId,
                score,
                remark: remarks[studentId],
                status: statuses[studentId]
            }));

            const attendanceToSubmit = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status,
                reason: reasons[studentId]
            }));

            await fetch('/api/teacher/grades', {
                method: 'POST',
                body: JSON.stringify({
                    examId,
                    grades: gradesToSubmit,
                    attendance: attendanceToSubmit
                })
            });
            setAlertConfig({
                title: "Academic Data Archived",
                message: "Institutional performance records have been successfully encrypted and finalized.",
                isOpen: true,
                variant: "success"
            });
            fetchData(); // Refresh
        } catch (e) {
            console.error(e);
            setAlertConfig({
                title: "Data Integrity Fault",
                message: "The synchronization sequence for performance records was interrupted.",
                isOpen: true,
                variant: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8">Loading gradebook...</div>;
    if (!exam) return <div className="p-8">Exam not found.</div>;

    const isLocked = exam.isLocked;

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/teacher/exams">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        {exam.title}
                        {isLocked && <span className="bg-amber-100 text-amber-700 text-[10px] px-2 py-1 rounded-full uppercase tracking-widest font-black">Locked</span>}
                    </h2>
                    <p className="text-gray-500 font-medium text-sm">{exam.subject?.name} • Class {exam.class?.name}</p>
                </div>
                {!isLocked && (
                    <div className="ml-auto">
                        <Button onClick={handleSave} isLoading={saving} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white gap-2 h-11 px-6 rounded-xl font-bold transition-all shadow-lg shadow-eduGreen-900/20 active:scale-95">
                            <Save className="w-4 h-4" /> Finalize Marks
                        </Button>
                    </div>
                )}
            </div>

            <Card className="border-0 shadow-2xl bg-white dark:bg-zinc-950 overflow-hidden rounded-[2rem]">
                <CardContent className="p-0">
                    <div className="grid grid-cols-12 gap-4 p-6 font-black uppercase text-[10px] tracking-widest text-zinc-400 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/20">
                        <div className="col-span-1">Registry</div>
                        <div className="col-span-4">Student Profile</div>
                        <div className="col-span-4 text-center">Exam Attendance</div>
                        <div className="col-span-3 text-right pr-4">Institutional Score</div>
                    </div>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                        {students.map((student, idx) => {
                            const currentStatus = attendance[student.id] || "PRESENT";
                            const isAbsent = currentStatus === 'ABSENT';
                            const isExcused = currentStatus === 'EXCUSED';

                            return (
                                <div key={student.id} className={cn(
                                    "grid grid-cols-12 gap-4 p-6 items-center transition-all group",
                                    isAbsent ? "bg-red-50/30 dark:bg-red-950/5" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/30"
                                )}>
                                    <div className="col-span-1 text-zinc-300 dark:text-zinc-800 font-black italic">#{String(idx + 1).padStart(2, '0')}</div>
                                    <div className="col-span-4">
                                        <div className="font-bold text-gray-900 dark:text-zinc-200 group-hover:text-eduGreen-500 transition-colors">{student.firstName} {student.lastName}</div>
                                        <div className="text-[10px] text-zinc-500 font-mono tracking-tighter uppercase">{student.studentCode}</div>
                                    </div>
                                    <div className="col-span-4 flex flex-col items-center gap-2">
                                        <div className="w-40">
                                            <Select
                                                disabled={isLocked}
                                                value={currentStatus}
                                                onValueChange={(val: string) => setAttendance({ ...attendance, [student.id]: val })}
                                            >
                                                <SelectTrigger className={cn(
                                                    "h-10 border-2",
                                                    currentStatus === 'PRESENT' ? "border-eduGreen-900/30 text-eduGreen-500" :
                                                        currentStatus === 'ABSENT' ? "border-red-900/30 text-red-500" : "border-amber-900/30 text-amber-500"
                                                )}>
                                                    <SelectValue placeholder="Status" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-900">
                                                    <SelectItem value="PRESENT">Present</SelectItem>
                                                    <SelectItem value="ABSENT">Absent</SelectItem>
                                                    <SelectItem value="EXCUSED">Excused</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {(isAbsent || isExcused) && (
                                            <input
                                                disabled={isLocked}
                                                placeholder="Add institutional reason..."
                                                value={reasons[student.id] || ""}
                                                onChange={(e) => setReasons({ ...reasons, [student.id]: e.target.value })}
                                                className="w-40 bg-zinc-100 dark:bg-zinc-900/50 border-0 rounded-lg h-8 px-3 text-[10px] font-medium text-zinc-500 outline-none placeholder:italic"
                                            />
                                        )}
                                    </div>
                                    <div className="col-span-3 flex flex-col items-end pr-2 gap-2">
                                        <div className="relative w-24">
                                            <Input
                                                disabled={isLocked || isAbsent}
                                                type="number"
                                                className={cn(
                                                    "text-right font-mono font-bold h-12 bg-transparent border-2 transition-all rounded-xl",
                                                    isAbsent ? "border-zinc-800 opacity-20" : "border-zinc-200 dark:border-zinc-800 focus:border-eduGreen-500",
                                                    !isAbsent && grades[student.id] ? "text-eduGreen-500 border-eduGreen-900/20" : ""
                                                )}
                                                placeholder={isAbsent ? "N/A" : "-"}
                                                value={isAbsent ? "" : (grades[student.id] || "")}
                                                onChange={(e) => setGrades({ ...grades, [student.id]: e.target.value })}
                                                max={exam.config?.maxScore || 100}
                                            />
                                            {!isAbsent && <div className="absolute right-2 top-1 text-[8px] text-zinc-500 pointer-events-none">/ {exam.config?.maxScore || 100}</div>}
                                        </div>
                                        {!isAbsent && (
                                            <div className="flex flex-col gap-2 w-full max-w-[200px]">
                                                <Select
                                                    disabled={isLocked}
                                                    value={statuses[student.id] || "SUBMITTED"}
                                                    onValueChange={(val: string) => setStatuses({ ...statuses, [student.id]: val })}
                                                >
                                                    <SelectTrigger className="h-9 border-zinc-900 bg-zinc-950/50 text-[8px]">
                                                        <SelectValue placeholder="Processing Status" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-950 border-zinc-900">
                                                        <SelectItem value="SUBMITTED">Submitted</SelectItem>
                                                        <SelectItem value="REVIEWED">Reviewed</SelectItem>
                                                        <SelectItem value="REMARK_REQUESTED">Needs Remark</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Input
                                                    disabled={isLocked}
                                                    placeholder="Teacher's remark..."
                                                    value={remarks[student.id] || ""}
                                                    onChange={(e) => setRemarks({ ...remarks, [student.id]: e.target.value })}
                                                    className="h-8 text-[9px] bg-zinc-900/30 border-zinc-900 rounded-lg placeholder:italic"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="p-6 bg-eduGreen-950/10 border border-eduGreen-900/20 rounded-[1.5rem] flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-eduGreen-900/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-5 h-5 text-eduGreen-500" />
                </div>
                <div>
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-eduGreen-500 mb-1">Institutional Integrity Rule</h4>
                    <p className="text-xs text-zinc-500 leading-relaxed font-medium">
                        Marks are automatically restricted for students flagged as <span className="text-red-500 font-bold">Absent</span>.
                        Records marked as <span className="text-amber-500 font-bold">Excused</span> will be flagged for the next scheduled remedial assessment.
                    </p>
                </div>
            </div>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />
        </div>
    );
}
