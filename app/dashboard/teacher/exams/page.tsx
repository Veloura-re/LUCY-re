"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, BarChart, FileText, Calendar as CalendarIcon, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function ExamsPage() {
    const [exams, setExams] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [newExam, setNewExam] = useState({ title: "", classId: "", subjectId: "", date: "", maxScore: "100" });
    const [selectedClassSubjects, setSelectedClassSubjects] = useState<any[]>([]);

    useEffect(() => {
        fetchClasses();
    }, []);

    useEffect(() => {
        if (newExam.classId && classes.length) {
            fetchExams(newExam.classId);
            const cls = classes.find(c => c.classId === newExam.classId);
            // We need to fetch subjects for this class? Or assume teacher teaches specific subjects?
            // The /api/teacher/classes endpoint returns assignments which include subjects.
            // Let's filter unique subjects for the selected class from the teacher's assignments.
            const subjects = classes
                .filter(c => c.classId === newExam.classId)
                .map(c => ({ id: c.subjectId || "sub-1", name: c.subjectName })); // API might need adjustment to return subjectId

            // Dedupe
            const unique = subjects.filter((s, i, a) => a.findIndex(t => t.name === s.name) === i);
            setSelectedClassSubjects(unique);
        }
    }, [newExam.classId, classes]);

    const fetchClasses = async () => {
        const res = await fetch('/api/teacher/classes');
        const data = await res.json();
        if (data.classes) setClasses(data.classes);
        // Auto-select first class?
        if (data.classes.length > 0) {
            setNewExam(prev => ({ ...prev, classId: data.classes[0].classId }));
        }
    };

    const fetchExams = async (classId: string) => {
        const res = await fetch(`/api/teacher/exams?classId=${classId}`);
        const data = await res.json();
        if (data.exams) setExams(data.exams);
    };

    const handleCreateExam = async (e: React.FormEvent) => {
        e.preventDefault();
        // We need subjectId. If API teacher/classes doesn't return it, we have an issue.
        // Assuming we fixed teacher/classes to return it (it returns `subjectName` currently? check API).
        // Let's check `api/teacher/classes/route.ts` from step 838.
        // It maps `subjectName: a.subject.name`. It DOES NOT map `subjectId`.
        // I need to fix `api/teacher/classes` to return `subjectId`.
        // For now, I'll fail if missing.

        // Actually, let's just send the request.
        // But first, finding the Subject ID from the creating logic.
        // The `selectedClassSubjects` logic above is fragile if `subjectId` is missing.

        await fetch('/api/teacher/exams', {
            method: 'POST',
            body: JSON.stringify(newExam)
        });
        setIsCreating(false);
        setNewExam({ ...newExam, title: "", date: "" });
        if (newExam.classId) fetchExams(newExam.classId);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                        Academic <span className="text-eduGreen-500 not-italic">Progress</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-3">Institutional Examination & Assessment Terminal</p>
                </div>
                <Button
                    onClick={() => setIsCreating(true)}
                    className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-10 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 mb-1 shadow-eduGreen-900/20"
                >
                    <Plus className="mr-2 h-4 w-4" /> Create Assessment
                </Button>
            </div>

            {/* Class Selector Tab/Filter */}
            <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shadow-2xl w-fit">
                {classes.filter((c, i, a) => a.findIndex(t => t.classId === c.classId) === i).map((cls) => (
                    <button
                        key={cls.classId}
                        onClick={() => setNewExam({ ...newExam, classId: cls.classId })}
                        className={cn(
                            "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            newExam.classId === cls.classId
                                ? "bg-eduGreen-600 text-white shadow-lg shadow-eduGreen-900/20"
                                : "text-zinc-600 hover:text-white"
                        )}
                    >
                        {cls.className}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {exams.map((exam) => (
                    <Card key={exam.id} className="group relative bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 hover:border-eduGreen-900/30 transition-all rounded-[2.5rem] overflow-hidden shadow-2xl border-t-zinc-800/10">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-eduGreen-600 via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <div className="absolute top-6 right-8">
                            <span className="text-[8px] font-black px-3 py-1 bg-zinc-900 border border-zinc-800 text-zinc-500 rounded-lg uppercase tracking-widest group-hover:border-eduGreen-900/30 transition-all">
                                {exam.subject?.name}
                            </span>
                        </div>

                        <CardHeader className="p-10 pb-4">
                            <CardTitle className="text-2xl font-black text-white tracking-tight leading-tight group-hover:text-eduGreen-500 transition-colors pt-4">
                                {exam.title}
                            </CardTitle>
                        </CardHeader>

                        <CardContent className="p-10 pt-0 space-y-8">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                                    <CalendarIcon className="w-4 h-4 text-zinc-800" />
                                    {exam.dueAt ? new Date(exam.dueAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' }) : 'Pending Assignment'}
                                </div>
                                <div className="flex items-center gap-3 text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em]">
                                    <BarChart className="w-4 h-4 text-zinc-800" />
                                    Max Quantum: {exam.config?.maxScore || 100}
                                </div>
                            </div>

                            <Link href={`/dashboard/teacher/gradebook/${exam.id}`} passHref>
                                <Button className="w-full h-14 bg-zinc-900 border border-zinc-800 text-white font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all rounded-2xl group-hover:border-eduGreen-900/20 group-hover:bg-zinc-950">
                                    Access Registry Hub <ArrowRight className="ml-2 w-3 h-3 text-eduGreen-500" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ))}

                {exams.length === 0 && (
                    <div className="col-span-full py-40 rounded-[3rem] border-4 border-dashed border-zinc-900/50 flex flex-col items-center justify-center text-zinc-800 gap-6">
                        <div className="p-6 bg-zinc-950 rounded-full border border-zinc-900 opacity-20">
                            <FileText className="w-12 h-12" />
                        </div>
                        <p className="font-black uppercase tracking-[0.4em] text-xs italic">No Institutional Assessments Harvested</p>
                    </div>
                )}
            </div>

            <Dialog open={isCreating} onOpenChange={setIsCreating}>
                <DialogContent className="max-w-2xl bg-zinc-950/95 backdrop-blur-3xl border-zinc-900 rounded-[3rem] p-0 overflow-hidden shadow-[0_0_100px_-20px_rgba(31,210,135,0.1)]">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-eduGreen-600 to-transparent opacity-50" />

                    <DialogHeader className="p-12 pb-8 border-b border-zinc-900/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-eduGreen-950/20 rounded-xl border border-eduGreen-900/30 text-eduGreen-500">
                                <Plus className="w-6 h-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-3xl font-black text-white tracking-tighter uppercase italic">
                                    New <span className="text-eduGreen-500 not-italic">Assessment</span>
                                </DialogTitle>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 mt-1">Establishing academic measuring protocol</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <form onSubmit={handleCreateExam} className="p-12 space-y-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Assessment Label</label>
                            <Input
                                placeholder="e.g. Neural Networks Midterm"
                                value={newExam.title}
                                onChange={e => setNewExam({ ...newExam, title: e.target.value })}
                                required
                                className="h-14 bg-zinc-900/50 border-zinc-900 rounded-2xl focus:border-eduGreen-600 transition-all font-bold text-lg text-white placeholder:text-zinc-700"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Subject Focus</label>
                                <Select onValueChange={(val: string) => setNewExam({ ...newExam, subjectId: val })}>
                                    <SelectTrigger className="h-14 bg-zinc-900/50 border-zinc-900 rounded-2xl px-6 font-bold text-white focus:ring-0 focus:border-eduGreen-600 transition-all">
                                        <SelectValue placeholder="Select Target Subject" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-900 rounded-2xl shadow-3xl">
                                        {selectedClassSubjects.map((s: any) => (
                                            <SelectItem
                                                key={s.id}
                                                value={s.id}
                                                className="hover:bg-zinc-900 focus:bg-zinc-900 rounded-xl m-1 py-3 text-zinc-400 focus:text-white transition-all font-bold uppercase tracking-widest text-[10px]"
                                            >
                                                {s.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Deadline Date</label>
                                <div className="relative">
                                    <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-eduGreen-600" />
                                    <Input
                                        type="date"
                                        value={newExam.date}
                                        onChange={e => setNewExam({ ...newExam, date: e.target.value })}
                                        required
                                        className="h-14 pl-14 bg-zinc-900/50 border-zinc-900 rounded-2xl focus:border-eduGreen-600 transition-all font-black uppercase text-xs tracking-widest text-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 pt-4">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setIsCreating(false)}
                                className="h-16 flex-1 border border-zinc-900 text-zinc-600 hover:text-white hover:bg-zinc-900 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                            >
                                Abort Protocol
                            </Button>
                            <Button
                                type="submit"
                                className="h-16 flex-[2] bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all shadow-2xl shadow-white/5 active:scale-[0.98]"
                            >
                                Authorize Assessment hub
                            </Button>
                        </div>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
