"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, BookOpen, Layers, CheckCircle2, ChevronRight, Loader2, Sparkles, ShieldCheck } from "lucide-react";
import { SpringingLoader } from "@/components/dashboard/springing-loader";

export default function StaffingPage() {
    const [activeTab, setActiveTab] = useState<'SUBJECTS' | 'HOMEROOM'>('SUBJECTS');
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>("");
    const [assignments, setAssignments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);

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

    const handleAssignHomeroom = async (classId: string, homeroomTeacherId: string | null) => {
        setSaving("homeroom-" + classId);
        try {
            const res = await fetch('/api/school/classes', {
                method: 'PATCH',
                body: JSON.stringify({ classId, homeroomTeacherId })
            });

            if (res.ok) {
                // Refresh data to reflect role changes and new assignments
                await fetchInitialData();
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
                <div className="space-y-4">
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Faculty <span className="text-eduGreen-500 italic">Mapping</span>
                    </h1>

                    <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-900 w-fit">
                        <button
                            onClick={() => setActiveTab('SUBJECTS')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'SUBJECTS' ? 'bg-eduGreen-600 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            Subject Assignments
                        </button>
                        <button
                            onClick={() => setActiveTab('HOMEROOM')}
                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'HOMEROOM' ? 'bg-eduGreen-600 text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
                        >
                            Homeroom Authority
                        </button>
                    </div>
                </div>

                <div className="hidden md:block">
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px] mb-1">Institutional Resource Allocation</p>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
                        <ShieldCheck className="w-3.5 h-3.5 text-eduGreen-500" />
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Final Authorization required</span>
                    </div>
                </div>
            </div>

            {activeTab === 'SUBJECTS' ? (
                <div className="grid lg:grid-cols-1 gap-12 items-start animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="space-y-6">
                        <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                            <CardHeader className="p-8 border-b border-zinc-900/50">
                                <CardTitle className="text-lg font-black text-white tracking-tight uppercase tracking-[0.2em] text-[10px]">Active Cohorts</CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex flex-wrap gap-3">
                                {classes.map((cls) => (
                                    <button
                                        key={cls.id}
                                        onClick={() => setSelectedClassId(cls.id)}
                                        className={`px-6 py-4 rounded-2xl flex items-center gap-4 transition-all group border ${selectedClassId === cls.id
                                            ? 'bg-eduGreen-600 border-eduGreen-500 text-white shadow-xl shadow-eduGreen-900/20'
                                            : 'bg-zinc-900/40 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300 border-zinc-900/50'
                                            }`}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className={`text-[8px] font-black uppercase tracking-widest ${selectedClassId === cls.id ? 'text-eduGreen-200' : 'text-zinc-700'}`}>
                                                {cls.gradeName}
                                            </span>
                                            <span className="font-black text-base tracking-tight">{cls.name}</span>
                                        </div>
                                    </button>
                                ))}
                            </CardContent>
                        </Card>
                    </div>

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
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                        <CardHeader className="p-10 border-b border-zinc-900/80">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-eduGreen-950/20 rounded-2xl border border-eduGreen-900/30">
                                    <Users className="w-5 h-5 text-eduGreen-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-white tracking-tight">Homeroom Authority</CardTitle>
                                    <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Institutional presence management by cohort</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-950">
                                {classes.map((cls) => (
                                    <div key={cls.id} className="p-10 flex flex-col md:flex-row md:items-center justify-between gap-8 hover:bg-eduGreen-900/5 transition-all group/row">
                                        <div className="flex items-center gap-6">
                                            <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center font-black text-zinc-600 text-xl group-hover/row:border-eduGreen-900/30 transition-all shadow-2xl relative overflow-hidden">
                                                {cls.name}
                                                <div className="absolute inset-x-0 bottom-0 h-1 bg-eduGreen-500/20" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-xl text-zinc-100 group-hover/row:text-white transition-colors tracking-tight">{cls.gradeName} &bull; {cls.name}</h4>
                                                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mt-1">{cls._count.students} Active Learners</p>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-80">
                                            <Select
                                                defaultValue={cls.homeroomTeacherId}
                                                onValueChange={(val: string) => handleAssignHomeroom(cls.id, val === "null" ? null : val)}
                                                disabled={saving === ("homeroom-" + cls.id)}
                                            >
                                                <SelectTrigger className="h-14 bg-zinc-950/50 border-2 border-zinc-900 rounded-xl text-white font-bold hover:border-eduGreen-900/30 transition-all">
                                                    {saving === ("homeroom-" + cls.id) ? (
                                                        <div className="flex items-center gap-2">
                                                            <Loader2 className="w-4 h-4 animate-spin text-eduGreen-500" />
                                                            <span className="text-[10px] uppercase tracking-widest text-zinc-500">Updating Access...</span>
                                                        </div>
                                                    ) : (
                                                        <SelectValue placeholder="Unassigned" />
                                                    )}
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                                                    {teachers.map((teacher: any) => (
                                                        <SelectItem key={teacher.id} value={teacher.id} className="focus:bg-eduGreen-900/20 focus:text-eduGreen-400 font-bold text-[10px] uppercase">
                                                            {teacher.name}
                                                        </SelectItem>
                                                    ))}
                                                    <SelectItem value="null" className="focus:bg-red-900/20 focus:text-red-400 font-bold text-[10px] uppercase">Revoke Authority</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
