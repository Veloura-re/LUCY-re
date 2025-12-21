"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Save, Search, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState("");
    const [periods, setPeriods] = useState<any[]>([]);
    const [selectedPeriodId, setSelectedPeriodId] = useState("");
    const [selectedSubjectId, setSelectedSubjectId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [students, setStudents] = useState<any[]>([]);
    const [attendance, setAttendance] = useState<{ [id: string]: string }>({});
    const [reasons, setReasons] = useState<{ [id: string]: string }>({});
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchClasses();
        fetchPeriods();
    }, []);

    useEffect(() => {
        if (selectedClassId && date) {
            fetchStudentsAndAttendance();
        }
    }, [selectedClassId, selectedSubjectId, selectedPeriodId, date]);

    const fetchPeriods = async () => {
        const res = await fetch('/api/school/periods');
        const data = await res.json();
        setPeriods(data.periods || []);
    };

    const fetchClasses = async () => {
        const res = await fetch('/api/teacher/classes');
        const data = await res.json();
        if (data.classes) {
            setClasses(data.classes);
            if (data.classes.length > 0) setSelectedClassId(data.classes[0].classId);
        }
    };

    const fetchStudentsAndAttendance = async () => {
        setLoading(true);
        try {
            const resStudents = await fetch(`/api/school/students`);
            const studentsData = await resStudents.json();

            const classStudents = studentsData.students.filter((s: any) => s.classId === selectedClassId);
            setStudents(classStudents);

            const queryParams = new URLSearchParams({
                classId: selectedClassId,
                date: date
            });
            if (selectedSubjectId && selectedSubjectId !== "none") queryParams.append("subjectId", selectedSubjectId);
            if (selectedPeriodId && selectedPeriodId !== "full") queryParams.append("periodId", selectedPeriodId);

            const resAtt = await fetch(`/api/teacher/attendance?${queryParams.toString()}`);
            const attData = await resAtt.json();

            const attMap: any = {};
            const reasonMap: any = {};
            classStudents.forEach((s: any) => attMap[s.id] = "PRESENT");

            if (attData.records) {
                attData.records.forEach((r: any) => {
                    attMap[r.studentId] = r.status;
                    reasonMap[r.studentId] = r.reason || "";
                });
            }
            setAttendance(attMap);
            setReasons(reasonMap);

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const records = Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status,
                reason: reasons[studentId]
            }));

            await fetch('/api/teacher/attendance', {
                method: 'POST',
                body: JSON.stringify({
                    classId: selectedClassId,
                    subjectId: (selectedSubjectId && selectedSubjectId !== "none") ? selectedSubjectId : null,
                    periodId: (selectedPeriodId && selectedPeriodId !== "full") ? selectedPeriodId : null,
                    date,
                    records
                })
            });
            alert("Attendance successfully logged.");
        } catch (e) {
            alert("Failed to save.");
        } finally {
            setSaving(false);
        }
    };

    const setAll = (status: string) => {
        const newAtt = { ...attendance };
        students.forEach(s => newAtt[s.id] = status);
        setAttendance(newAtt);
    };

    const selectedClass = classes.find(c => c.classId === selectedClassId);
    const availableSubjects = selectedClass?.subjects || [];

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-4xl font-black tracking-tight text-white italic">
                        Daily <span className="text-zinc-700 not-italic ml-2">Authority Log</span>
                    </h2>
                    <p className="text-zinc-500 font-bold text-sm mt-1 uppercase tracking-widest">Mark attendance for institutional records.</p>
                </div>
                <div className="flex gap-4">
                    <Button onClick={handleSave} disabled={saving} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 active:scale-95 transition-all">
                        {saving ? "Syncing..." : <><Save className="w-4 h-4 mr-2" /> Seal Attendance</>}
                    </Button>
                </div>
            </div>

            <Card className="p-8 bg-zinc-950/40 backdrop-blur-md border-zinc-900/50 rounded-[2.5rem] relative z-20">
                <div className="grid md:grid-cols-4 gap-8 items-end">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Class Cohort</label>
                        <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                            <SelectTrigger className="h-14 bg-zinc-950/50 border-2 border-zinc-900 rounded-xl text-white font-bold">
                                <SelectValue placeholder="Select Class" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-900">
                                {classes.filter((c, i, a) => a.findIndex(t => t.classId === c.classId) === i).map((cls) => (
                                    <SelectItem key={cls.id} value={cls.classId} className="text-zinc-400 focus:text-white focus:bg-eduGreen-950/20">
                                        {cls.className} (Grade {cls.gradeLevel})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Teaching Slot</label>
                        <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                            <SelectTrigger className="h-14 bg-zinc-950/50 border-2 border-zinc-900 rounded-xl text-white font-bold">
                                <SelectValue placeholder="Full Day (Homeroom)" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-900">
                                <SelectItem value="full" className="text-zinc-400 focus:text-white">Full Day (Homeroom)</SelectItem>
                                {periods.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id} className="text-zinc-400 focus:text-white">{p.name} ({p.startTime})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Subject</label>
                        <Select value={selectedSubjectId} onValueChange={setSelectedSubjectId}>
                            <SelectTrigger className="h-14 bg-zinc-950/50 border-2 border-zinc-900 rounded-xl text-white font-bold">
                                <SelectValue placeholder="Optional" />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-900">
                                <SelectItem value="none" className="text-zinc-400 focus:text-white">All Subjects</SelectItem>
                                {availableSubjects.map((sub: any) => (
                                    <SelectItem key={sub.id} value={sub.id} className="text-zinc-400 focus:text-white">{sub.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Operational Date</label>
                        <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="h-14 bg-zinc-950/50 border-2 border-zinc-900 rounded-xl text-white font-mono font-bold" />
                    </div>
                </div>
            </Card>

            <Card className="bg-zinc-900/30 backdrop-blur-md border-zinc-900/80 rounded-[2.5rem] overflow-hidden">
                <div className="p-8 border-b border-zinc-900/50 flex justify-between items-center bg-zinc-950/20">
                    <span className="text-xl font-black text-white tracking-tight">{students.length} <span className="text-zinc-700">Records Detected</span></span>
                    <div className="flex gap-4">
                        <button onClick={() => setAll('PRESENT')} className="text-[10px] font-black uppercase tracking-widest text-eduGreen-500 hover:text-eduGreen-400 transition-colors">Mass Present</button>
                        <div className="w-[1px] h-4 bg-zinc-800" />
                        <button onClick={() => setAll('ABSENT')} className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 transition-colors">Mass Absent</button>
                    </div>
                </div>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-950">
                        {students.map((student) => {
                            const currentStatus = attendance[student.id] || "PRESENT";
                            return (
                                <div key={student.id} className="p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 hover:bg-eduGreen-900/5 transition-all group/row">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center font-black text-zinc-600 text-xl group-hover/row:border-eduGreen-900/30 transition-all shadow-2xl relative overflow-hidden">
                                            {student.firstName[0]}{student.lastName[0]}
                                            <div className="absolute inset-x-0 bottom-0 h-1 bg-eduGreen-500/20" />
                                        </div>
                                        <div>
                                            <div className="font-black text-xl text-zinc-100 group-hover/row:text-white transition-colors tracking-tight">{student.firstName} {student.lastName}</div>
                                            <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mt-1">{student.studentCode}</div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center gap-6">
                                        {(currentStatus === 'ABSENT' || currentStatus === 'EXCUSED' || currentStatus === 'LATE') && (
                                            <input
                                                placeholder="Add institutional remark..."
                                                value={reasons[student.id] || ""}
                                                onChange={(e) => setReasons({ ...reasons, [student.id]: e.target.value })}
                                                className="w-full md:w-64 bg-zinc-950 border-2 border-zinc-900 rounded-xl h-12 px-4 text-xs text-white placeholder:text-zinc-800 focus:border-zinc-700 outline-none transition-all italic font-medium"
                                            />
                                        )}
                                        <div className="flex gap-2 bg-zinc-950 p-1.5 rounded-[1.25rem] border border-zinc-900 shadow-xl">
                                            <StatusParams
                                                status="PRESENT"
                                                icon={CheckCircle}
                                                active={currentStatus === 'PRESENT'}
                                                onClick={() => setAttendance({ ...attendance, [student.id]: 'PRESENT' })}
                                                color="text-eduGreen-500"
                                                bgColor="bg-eduGreen-950/20"
                                            />
                                            <StatusParams
                                                status="LATE"
                                                icon={Clock}
                                                active={currentStatus === 'LATE'}
                                                onClick={() => setAttendance({ ...attendance, [student.id]: 'LATE' })}
                                                color="text-amber-500"
                                                bgColor="bg-amber-950/20"
                                            />
                                            <StatusParams
                                                status="ABSENT"
                                                icon={XCircle}
                                                active={currentStatus === 'ABSENT'}
                                                onClick={() => setAttendance({ ...attendance, [student.id]: 'ABSENT' })}
                                                color="text-red-500"
                                                bgColor="bg-red-950/20"
                                            />
                                            <StatusParams
                                                status="EXCUSED"
                                                icon={AlertCircle}
                                                active={currentStatus === 'EXCUSED'}
                                                onClick={() => setAttendance({ ...attendance, [student.id]: 'EXCUSED' })}
                                                color="text-blue-500"
                                                bgColor="bg-blue-950/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {students.length === 0 && <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
                            <Search className="w-10 h-10" />
                            <p className="text-[10px] font-black uppercase tracking-widest">No active cohort results</p>
                        </div>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function StatusParams({ status, icon: Icon, active, onClick, color, bgColor }: any) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "h-10 px-4 rounded-xl transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest outline-none",
                active ? `${bgColor} ${color} shadow-lg ring-1 ring-white/5` : "text-zinc-700 hover:bg-zinc-900 hover:text-zinc-500"
            )}
        >
            <Icon className={cn("w-4 h-4", active ? color : "text-zinc-800")} />
            <span className={cn(active ? "inline" : "hidden")}>{status}</span>
        </button>
    );
}
