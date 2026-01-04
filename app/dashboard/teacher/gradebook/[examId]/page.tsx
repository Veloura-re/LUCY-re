"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertModal } from "@/components/ui/confirmation-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
    Save, ArrowLeft, CheckCircle, List, AlignLeft,
    FileText, CheckCircle2, Zap, Brain, MessageSquare,
    History, Edit
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function GradebookPage() {
    const params = useParams();
    const router = useRouter();
    const examId = params.examId as string;

    const [exam, setExam] = useState<any>(null);
    const [students, setStudents] = useState<any[]>([]);
    const [attempts, setAttempts] = useState<any[]>([]);
    const [grades, setGrades] = useState<{ [studentId: string]: string }>({});
    const [attendance, setAttendance] = useState<{ [studentId: string]: string }>({});
    const [reasons, setReasons] = useState<{ [studentId: string]: string }>({});
    const [remarks, setRemarks] = useState<{ [studentId: string]: string }>({});
    const [statuses, setStatuses] = useState<{ [studentId: string]: string }>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [isReviewOpen, setIsReviewOpen] = useState(false);
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
                setAttempts(data.attempts || []);

                const resStudents = await fetch(`/api/school/students`);
                const studentsData = await resStudents.json();
                if (studentsData.students) {
                    const classStudents = studentsData.students.filter((s: any) => s.classId === data.exam.classId);
                    setStudents(classStudents);
                }

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
                headers: { 'Content-Type': 'application/json' },
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
            fetchData();
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

    const handlePublish = async () => {
        if (!confirm("Are you sure you want to publish these results? This will make them visible to students and parents.")) return;
        setSaving(true);
        try {
            await fetch(`/api/teacher/exams/${examId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isPublished: true, isLocked: true })
            });
            setAlertConfig({ title: "Results Published", message: "Broadcasting finalized data...", isOpen: true, variant: "success" });
            fetchData();
        } catch (e) { console.error(e); } finally { setSaving(false); }
    };

    const handleBulkReview = () => {
        const newStatuses = { ...statuses };
        students.forEach((s: any) => { if (attendance[s.id] !== 'ABSENT') newStatuses[s.id] = 'REVIEWED'; });
        setStatuses(newStatuses);
    };

    const handleExportCsv = () => {
        const headers = ["Student Name", "Student Code", "Attendance", "Score / " + (exam.config?.maxScore || 100), "Remark"];
        const rows = students.map((s: any) => [
            `${s.firstName} ${s.lastName}`,
            s.studentCode,
            attendance[s.id] || "PRESENT",
            grades[s.id] || "0",
            remarks[s.id] || ""
        ]);

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${exam.title}_Results.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) return <div className="p-8">Loading gradebook...</div>;
    if (!exam) return <div className="p-8">Exam not found.</div>;

    const isLocked = exam.isLocked;

    const getPerformanceColor = (pct: number) => {
        if (pct >= 80) return "text-emerald-500";
        if (pct >= 60) return "text-blue-500";
        if (pct >= 40) return "text-amber-500";
        return "text-rose-500";
    };

    const SubmissionReviewModal = ({ student }: { student: any }) => {
        const attempt = attempts.find((a: any) => a.studentId === student.id);
        const questions = exam.questions || [];
        const gradingDetails = (attempt?.metadata?.gradingDetails) || [];
        const aiScore = attempt ? parseFloat(attempt.score.toString()).toFixed(1) : "0.0";

        const applyAiScore = () => {
            setGrades(prev => ({ ...prev, [student.id]: aiScore }));
            setAlertConfig({
                title: "Score Synchronized",
                message: `${student.firstName}'s automated score has been transferred to the official record.`,
                isOpen: true,
                variant: "success"
            });
            setIsReviewOpen(false);
        };

        return (
            <Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-zinc-950 border-zinc-900 rounded-[2.5rem] p-10">
                    <DialogHeader>
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-eduGreen-900/20 rounded-2xl flex items-center justify-center border border-eduGreen-500/20">
                                <History className="w-6 h-6 text-eduGreen-500" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black text-white italic uppercase">{student.firstName}'s Audit</DialogTitle>
                                <DialogDescription className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Neural Assessment Breakdown</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    {!attempt ? (
                        <div className="text-center py-20 text-zinc-600 font-bold uppercase tracking-widest">No valid submission record found.</div>
                    ) : (
                        <div className="space-y-8">
                            <div className="grid grid-cols-3 gap-6">
                                <Card className="bg-zinc-900/50 border-zinc-900 rounded-3xl p-6 relative group overflow-hidden">
                                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Auto-Score</div>
                                    <div className="text-4xl font-black text-white italic">{aiScore}%</div>
                                    <div className="absolute inset-0 bg-eduGreen-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Button onClick={applyAiScore} variant="ghost" className="text-eduGreen-400 font-black uppercase text-[10px] tracking-widest gap-2">
                                            <Zap className="w-3 h-3" /> Apply to Record
                                        </Button>
                                    </div>
                                </Card>
                                <Card className="bg-zinc-900/50 border-zinc-900 rounded-3xl p-6">
                                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Submitted</div>
                                    <div className="text-xl font-bold text-zinc-300">{new Date(attempt.submittedAt).toLocaleTimeString()}</div>
                                </Card>
                                <Card className="bg-zinc-900/50 border-zinc-900 rounded-3xl p-6">
                                    <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Verdict</div>
                                    <div className="text-xl font-bold text-zinc-300">VALIDATED</div>
                                </Card>
                            </div>

                            <div className="space-y-6">
                                {questions.map((q: any, i: number) => {
                                    const studentAns = attempt.answers[q.id];
                                    const grading = gradingDetails.find((d: any) => d.id === q.id);

                                    return (
                                        <div key={q.id} className="bg-zinc-900/20 border border-zinc-900 rounded-3xl p-8 space-y-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="border-zinc-800 text-zinc-600 font-black">Q{i + 1}</Badge>
                                                    <h4 className="font-bold text-zinc-200">{q.text}</h4>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-eduGreen-500 italic">{grading?.score || 0}/{q.points}</div>
                                                    <div className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Points Secured</div>
                                                </div>
                                            </div>

                                            <div className="pl-4 border-l-2 border-zinc-800 space-y-2">
                                                <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Student Response</div>
                                                <p className="text-sm text-zinc-400 italic">"{studentAns || "No response provided"}"</p>
                                            </div>

                                            {grading?.feedback && (
                                                <div className="bg-eduGreen-950/20 border border-eduGreen-900/30 rounded-2xl p-4 flex gap-3">
                                                    <Brain className="w-5 h-5 text-eduGreen-500 shrink-0" />
                                                    <div>
                                                        <div className="text-[9px] font-black text-eduGreen-500 uppercase tracking-widest mb-1">Neural Grading Logic</div>
                                                        <p className="text-xs text-zinc-300 italic">"{grading.feedback}"</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex justify-between items-center pt-6 border-t border-zinc-900">
                                <Button onClick={applyAiScore} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase tracking-widest px-8 rounded-2xl h-14 gap-2">
                                    <Save className="w-4 h-4" /> Authorize AI Score
                                </Button>
                                <Button onClick={() => setIsReviewOpen(false)} variant="ghost" className="text-zinc-500 hover:text-white font-black uppercase tracking-widest px-10 rounded-2xl h-14">
                                    Exit Audit
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        );
    };

    return (
        <div className="space-y-6 animate-in fade-in pb-40">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/teacher/exams">
                    <Button variant="ghost" size="icon" className="text-zinc-500 hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h2 className="text-2xl font-black flex items-center gap-2 text-white italic uppercase">
                        {exam.title}
                        {isLocked && <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 uppercase text-[8px] h-5">Finalized</Badge>}
                    </h2>
                    <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">{exam.subject?.name} • Class {exam.class?.name}</p>
                </div>
                {!exam.isPublished && (
                    <div className="ml-auto flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleExportCsv}
                            className="bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-white h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[9px] gap-2"
                        >
                            <FileText className="w-4 h-4" /> Export Ledger
                        </Button>
                        <Button variant="outline" onClick={handleBulkReview} className="bg-zinc-950 border-zinc-900 text-zinc-600 hover:text-white h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[9px]">
                            Secure All
                        </Button>
                        <Button onClick={handleSave} isLoading={saving} className="bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 gap-3 h-12 px-6 rounded-2xl font-black uppercase tracking-widest text-[9px]">
                            <History className="w-4 h-4" /> Log Draft
                        </Button>
                        <Button onClick={handlePublish} isLoading={saving} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-12 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-eduGreen-900/40">
                            Authorize & Publish
                        </Button>
                    </div>
                )}
            </div>

            <Card className="border-zinc-900 shadow-2xl bg-zinc-950 overflow-hidden rounded-[3rem]">
                <CardContent className="p-0">
                    <div className="grid grid-cols-12 gap-4 p-8 font-black uppercase text-[10px] tracking-[0.2em] text-zinc-600 border-b border-zinc-900 bg-zinc-900/20">
                        <div className="col-span-1">Reg</div>
                        <div className="col-span-3">Entity</div>
                        <div className="col-span-3 text-center">Status</div>
                        <div className="col-span-2 text-center">AI Audit</div>
                        <div className="col-span-3 text-right">Aggregate Score</div>
                    </div>
                    <div className="divide-y divide-zinc-900">
                        {students.map((student: any, idx: number) => {
                            const currentStatus = attendance[student.id] || "PRESENT";
                            const isAbsent = currentStatus === 'ABSENT';
                            const attempt = attempts.find((a: any) => a.studentId === student.id);

                            return (
                                <div key={student.id} className={cn(
                                    "grid grid-cols-12 gap-4 p-8 items-center transition-all group",
                                    isAbsent ? "bg-red-950/5 opacity-50" : "hover:bg-zinc-900/30"
                                )}>
                                    <div className="col-span-1 text-zinc-800 font-black italic">#{String(idx + 1).padStart(2, '0')}</div>
                                    <div className="col-span-3">
                                        <div className="font-black text-zinc-100 group-hover:text-eduGreen-500 transition-colors">{student.firstName} {student.lastName}</div>
                                        <div className="text-[9px] text-zinc-600 font-bold tracking-widest uppercase">{student.studentCode}</div>
                                    </div>
                                    <div className="col-span-3 flex justify-center">
                                        <Select
                                            disabled={isLocked}
                                            value={currentStatus}
                                            onValueChange={(val: string) => setAttendance({ ...attendance, [student.id]: val })}
                                        >
                                            <SelectTrigger className={cn(
                                                "h-11 border-none bg-zinc-900 rounded-xl font-black uppercase tracking-widest text-[9px] w-32",
                                                currentStatus === 'PRESENT' ? "text-eduGreen-500" : "text-red-500"
                                            )}>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-900">
                                                <SelectItem value="PRESENT">Present</SelectItem>
                                                <SelectItem value="ABSENT">Absent</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="col-span-2 flex justify-center">
                                        {attempt ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => { setSelectedStudent(student); setIsReviewOpen(true); }}
                                                className="text-purple-500 hover:text-purple-400 hover:bg-purple-500/10 h-10 w-10 rounded-xl border border-purple-500/20"
                                            >
                                                <Brain className="w-5 h-5" />
                                            </Button>
                                        ) : (
                                            <div className="text-[8px] font-black text-zinc-800 uppercase italic">Pending...</div>
                                        )}
                                    </div>
                                    <div className="col-span-3 flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-3">
                                            <Input
                                                disabled={isLocked || isAbsent}
                                                type="number"
                                                className={cn(
                                                    "text-right font-black font-mono h-12 bg-zinc-950 border-zinc-900 w-24 rounded-2xl focus:border-eduGreen-500",
                                                    !isAbsent && grades[student.id] ? getPerformanceColor((parseFloat(grades[student.id]) / (exam.config?.maxScore || 100)) * 100) : "text-zinc-500"
                                                )}
                                                value={isAbsent ? "" : (grades[student.id] || "")}
                                                onChange={(e) => setGrades({ ...grades, [student.id]: e.target.value })}
                                            />
                                            <span className="text-[10px] font-black text-zinc-700 uppercase">/ {exam.config?.maxScore || 100}</span>
                                        </div>
                                        <Input
                                            disabled={isLocked}
                                            placeholder="Audit Remark..."
                                            value={remarks[student.id] || ""}
                                            onChange={(e) => setRemarks({ ...remarks, [student.id]: e.target.value })}
                                            className="h-8 text-[9px] bg-zinc-950/50 border-zinc-900 rounded-lg placeholder:italic text-zinc-400"
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {selectedStudent && <SubmissionReviewModal student={selectedStudent} />}

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig((prev: any) => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />
        </div>
    );
}
