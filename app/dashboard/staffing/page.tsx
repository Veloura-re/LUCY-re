"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, BookOpen, Layers, CheckCircle2, ChevronRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { SpringingLoader } from "@/components/dashboard/springing-loader";

export default function StaffingPage() {
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null); // subjectId being saved

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchAssignments(selectedClassId);
        }
    }, [selectedClassId]);

    const fetchInitialData = async () => {
        try {
            const [cRes, sRes, tRes] = await Promise.all([
                fetch('/api/school/classes'),
                fetch('/api/school/subjects'),
                fetch('/api/school/teachers')
            ]);

            const [cData, sData, tData] = await Promise.all([
                cRes.json(),
                sRes.json(),
                tRes.json()
            ]);

            // Flatten classes from grades
            const flattened = (cData.grades || []).flatMap((g: any) =>
                g.classes.map((c: any) => ({ ...c, gradeName: g.name }))
            );

            setClasses(flattened);
            setSubjects(sData.subjects || []);
            setTeachers(tData.teachers || []);

            if (flattened.length > 0) {
                setSelectedClassId(flattened[0].id);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAssignments = async (classId: string) => {
        try {
            const res = await fetch(`/api/school/staffing?classId=${classId}`);
            const data = await res.json();
            setAssignments(data.assignments || []);
        } catch (e) {
            console.error(e);
        }
    };

    const handleAssign = async (subjectId: string, teacherId: string) => {
        setSaving(subjectId);
        try {
            const res = await fetch('/api/school/staffing', {
                method: 'POST',
                body: JSON.stringify({
                    classId: selectedClassId,
                    subjectId,
                    teacherId
                })
            });

            if (res.ok) {
                fetchAssignments(selectedClassId);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(null);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <SpringingLoader message="Orchestrating Faculty Allocations" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Faculty <span className="text-eduGreen-500 italic">Mapping</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Institutional Resource Allocation & Staffing Authority</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-1 gap-12 items-start">
                {/* Selector Section */}
                <div className="space-y-6">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                        <CardHeader className="p-8 border-b border-zinc-900/50">
                            <CardTitle className="text-lg font-black text-white tracking-tight uppercase tracking-[0.2em] text-[10px]">Active Cohorts</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-2">
                            {classes.map((cls) => (
                                <button
                                    key={cls.id}
                                    onClick={() => setSelectedClassId(cls.id)}
                                    className={`w-full p-6 rounded-[1.5rem] flex items-center justify-between transition-all group ${selectedClassId === cls.id
                                        ? 'bg-eduGreen-600 text-white shadow-xl shadow-eduGreen-900/20'
                                        : 'bg-zinc-900/40 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border border-zinc-900/50'
                                        }`}
                                >
                                    <div className="flex flex-col items-start px-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${selectedClassId === cls.id ? 'text-eduGreen-200' : 'text-zinc-700'}`}>
                                            {cls.gradeName}
                                        </span>
                                        <span className="font-black text-lg tracking-tight">{cls.name}</span>
                                    </div>
                                    <ChevronRight className={`w-5 h-5 transition-transform ${selectedClassId === cls.id ? 'translate-x-1' : 'group-hover:translate-x-1 opacity-20'}`} />
                                </button>
                            ))}
                        </CardContent>
                    </Card>

                    <div className="p-8 bg-eduGreen-950/10 border border-eduGreen-900/20 rounded-[2rem] space-y-4">
                        <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-eduGreen-500" />
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Structural Rules</h4>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-600 leading-relaxed uppercase">
                            Each active discipline in the cohort requires a verified faculty member. Timetable slots will only be valid if a teacher is permanently assigned to the subject-class node.
                        </p>
                    </div>
                </div>

                {/* Assignment Grid */}
                <div className="space-y-8">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl relative z-20">
                        <CardHeader className="p-10 border-b border-zinc-900/80">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-eduGreen-950/20 rounded-2xl border border-eduGreen-900/30">
                                    <Layers className="w-5 h-5 text-eduGreen-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-white tracking-tight">Discipline Matrix</CardTitle>
                                    <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Assignments for {classes.find(c => c.id === selectedClassId)?.name}</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 mb-10">
                            <div className="divide-y divide-zinc-950">
                                {subjects.map((subject) => {
                                    const assignment = assignments.find(a => a.subjectId === subject.id);
                                    return (
                                        <div key={subject.id} className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-eduGreen-900/5 transition-all group/row">
                                            <div className="flex items-center gap-6">
                                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center group-hover/row:border-eduGreen-900/30 transition-all shadow-2xl relative overflow-hidden">
                                                    <BookOpen className="w-6 h-6 text-zinc-800 group-hover/row:text-eduGreen-500" />
                                                    <div className="absolute inset-x-0 bottom-0 h-1 bg-eduGreen-500/20" />
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xl text-zinc-100 group-hover/row:text-white transition-colors tracking-tight">{subject.name}</h4>
                                                    <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mt-1">Core Discipline</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col sm:flex-row items-center gap-6">
                                                {assignment && (
                                                    <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-eduGreen-950/20 border border-eduGreen-900/20 animate-in fade-in zoom-in-95">
                                                        <CheckCircle2 className="w-4 h-4 text-eduGreen-500" />
                                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Synchronized</span>
                                                    </div>
                                                )}

                                                <div className="w-full sm:w-64">
                                                    <Select
                                                        defaultValue={assignment?.teacherId}
                                                        onValueChange={(val: string) => handleAssign(subject.id, val)}
                                                        disabled={saving === subject.id}
                                                    >
                                                        <SelectTrigger className="h-14 bg-zinc-950/50 border-2 border-zinc-900 rounded-xl text-white font-bold hover:border-eduGreen-900/30 transition-all">
                                                            {saving === subject.id ? (
                                                                <div className="flex items-center gap-2">
                                                                    <Loader2 className="w-4 h-4 animate-spin text-eduGreen-500" />
                                                                    <span className="text-[10px] uppercase tracking-widest text-zinc-500">Mapping...</span>
                                                                </div>
                                                            ) : (
                                                                <SelectValue placeholder="Select Instructor" />
                                                            )}
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                                                            {teachers.map((teacher: any) => (
                                                                <SelectItem key={teacher.id} value={teacher.id} className="focus:bg-eduGreen-900/20 focus:text-eduGreen-400 font-bold text-[10px] uppercase">
                                                                    {teacher.name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {subjects.length === 0 && (
                                    <div className="p-20 text-center flex flex-col items-center gap-4 opacity-40">
                                        <BookOpen className="w-12 h-12 text-zinc-700" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 leading-relaxed max-w-[200px]">
                                            No disciplines registered in current institution.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
