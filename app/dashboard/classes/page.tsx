"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, BookOpen, Layers, ChevronRight, ChevronDown, School, Trash2, Check, MessageSquare } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SpringingLoader } from "@/components/dashboard/springing-loader";

export default function ClassesPage() {
    const [grades, setGrades] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [allTeachers, setAllTeachers] = useState<any[]>([]);

    const [expandedGrade, setExpandedGrade] = useState<string | null>(null);
    const [isAddingGrade, setIsAddingGrade] = useState(false);
    const [isAddingClass, setIsAddingClass] = useState<string | null>(null); // gradeId
    const [isAddingSubject, setIsAddingSubject] = useState(false);

    // Form States
    const [newGradeName, setNewGradeName] = useState("");
    const [newGradeLevel, setNewGradeLevel] = useState("");
    const [newClassName, setNewClassName] = useState("");
    const [newSubjectName, setNewSubjectName] = useState("");
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchData(), fetchSubjects(), fetchTeachers()]);
            setFetching(false);
        };
        init();
    }, []);

    const fetchData = async () => {
        const res = await fetch('/api/school/classes');
        const data = await res.json();
        if (data.grades) setGrades(data.grades);
    };

    const fetchTeachers = async () => {
        const res = await fetch('/api/school/teachers');
        const data = await res.json();
        if (data.teachers) setAllTeachers(data.teachers);
    };

    const handleAssignHomeroom = async (classId: string, homeroomTeacherId: string | null) => {
        setLoading(true);
        try {
            const res = await fetch('/api/school/classes', {
                method: 'PATCH',
                body: JSON.stringify({ classId, homeroomTeacherId })
            });

            if (res.ok) {
                fetchData(); // Refresh to show new homeroom teacher
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchSubjects = async () => {
        const res = await fetch('/api/school/subjects');
        const data = await res.json();
        if (data.subjects) setSubjects(data.subjects);
    };

    const handleCreateGrade = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch('/api/school/classes', {
                method: 'POST',
                body: JSON.stringify({ type: 'GRADE', name: newGradeName, level: newGradeLevel })
            });
            setIsAddingGrade(false);
            setNewGradeName("");
            setNewGradeLevel("");
            fetchData();
        } finally {
            setLoading(false);
        }
    };

    const handleCreateClass = async (e: React.FormEvent, gradeId: string) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch('/api/school/classes', {
                method: 'POST',
                body: JSON.stringify({ type: 'CLASS', gradeId, name: newClassName })
            });
            setIsAddingClass(null);
            setNewClassName("");
            fetchData();
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await fetch('/api/school/subjects', {
                method: 'POST',
                body: JSON.stringify({ name: newSubjectName })
            });
            setIsAddingSubject(false);
            setNewSubjectName("");
            fetchSubjects();
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteClass = async (id: string) => {
        if (!confirm("Are you sure you want to delete this class?")) return;
        try {
            const res = await fetch('/api/school/classes', {
                method: 'DELETE',
                body: JSON.stringify({ id, type: 'CLASS' })
            });
            if (res.ok) fetchData();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDeleteSubject = async (id: string) => {
        if (!confirm("Are you sure you want to delete this subject?")) return;
        try {
            const res = await fetch('/api/school/subjects', {
                method: 'DELETE',
                body: JSON.stringify({ id })
            });
            if (res.ok) fetchSubjects();
        } catch (e) {
            console.error(e);
        }
    };

    if (fetching) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <SpringingLoader message="Mapping Institutional Hierarchy & Curriculum" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Academic <span className="text-eduGreen-500 italic">Architecture</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Institutional Cohorts & Curriculum Registry</p>
                </div>
            </div>

            <div className="grid lg:grid-cols-1 gap-12 items-start">
                {/* Grade Levels Section */}
                <div className="space-y-8">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                        <CardHeader className="p-10 border-b border-zinc-900/80 flex flex-row items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-eduGreen-950/20 rounded-2xl border border-eduGreen-900/30">
                                    <Layers className="w-5 h-5 text-eduGreen-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-white tracking-tight">Grade Levels</CardTitle>
                                    <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Hierarchical academic structure</CardDescription>
                                </div>
                            </div>
                            <Button
                                onClick={() => setIsAddingGrade(true)}
                                className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-12 px-6 rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 active:scale-95 transition-all"
                            >
                                <Plus className="w-4 h-4 mr-2" /> New Grade
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isAddingGrade && (
                                <div className="p-10 bg-zinc-950/50 border-b border-zinc-900 animate-in slide-in-from-top-4 duration-500">
                                    <form onSubmit={handleCreateGrade} className="flex flex-col sm:flex-row gap-6 items-end max-w-2xl">
                                        <div className="flex-1 space-y-3 w-full">
                                            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Display Name</label>
                                            <Input
                                                placeholder="e.g. Senior Year"
                                                value={newGradeName}
                                                onChange={e => setNewGradeName(e.target.value)}
                                                required
                                                className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                            />
                                        </div>
                                        <div className="w-full sm:w-28 space-y-3">
                                            <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Numeric</label>
                                            <Input
                                                placeholder="Level"
                                                type="number"
                                                value={newGradeLevel}
                                                onChange={e => setNewGradeLevel(e.target.value)}
                                                required
                                                className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2 text-center font-mono"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Button type="submit" isLoading={loading} className="bg-white hover:bg-zinc-200 text-black h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest">Deploy</Button>
                                            <Button variant="ghost" type="button" disabled={loading} onClick={() => setIsAddingGrade(false)} className="text-zinc-600 hover:text-white font-black uppercase tracking-[0.2em] text-[10px] h-14">Discard</Button>
                                        </div>
                                    </form>
                                </div>
                            )}

                            <div className="divide-y divide-zinc-900">
                                {grades.map((grade) => (
                                    <div key={grade.id} className="group transition-all">
                                        <div
                                            className={`p-10 flex items-center justify-between cursor-pointer hover:bg-eduGreen-900/5 transition-all ${expandedGrade === grade.id ? 'bg-eduGreen-900/5' : ''}`}
                                            onClick={() => setExpandedGrade(expandedGrade === grade.id ? null : grade.id)}
                                        >
                                            <div className="flex items-center gap-8">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg transition-all border-2 ${expandedGrade === grade.id ? 'bg-eduGreen-950/40 border-eduGreen-500/50 text-eduGreen-400' : 'bg-zinc-950 border-zinc-800 text-zinc-600 group-hover:border-zinc-700'}`}>
                                                    {grade.level}
                                                </div>
                                                <div>
                                                    <h4 className="font-black text-xl text-zinc-100 group-hover:text-white transition-colors tracking-tight">{grade.name}</h4>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">Academic Tier</p>
                                                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                        <span className="text-[9px] font-black text-eduGreen-700 uppercase tracking-tighter">{grade.classes.length} Class Nodes</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl border transition-all ${expandedGrade === grade.id ? 'bg-eduGreen-950/20 border-eduGreen-900/30 text-eduGreen-500 rotate-180' : 'bg-zinc-950 border-zinc-900 text-zinc-800 group-hover:text-zinc-600'}`}>
                                                    <ChevronDown className="w-5 h-5" />
                                                </div>
                                            </div>
                                        </div>

                                        {expandedGrade === grade.id && (
                                            <div className="bg-zinc-950/80 p-10 pt-2 border-t border-zinc-900 animate-in slide-in-from-top-4 duration-500">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                                                    {grade.classes.map((cls: any) => (
                                                        <div key={cls.id} className="p-6 bg-zinc-900 rounded-[1.5rem] border border-zinc-800 flex items-center justify-between group/cls hover:border-eduGreen-500/30 hover:bg-eduGreen-900/5 transition-all relative overflow-hidden">
                                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover/cls:opacity-100 transition-opacity" />
                                                            <div className="relative z-10 flex-1">
                                                                <span className="font-black text-zinc-100 group-hover/cls:text-white transition-colors tracking-tight block">{cls.name}</span>
                                                                <div className="flex items-center gap-3 mt-1">
                                                                    <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">{cls._count.students} Students</span>
                                                                    {cls.homeroomTeacher && (
                                                                        <>
                                                                            <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                                            <span className="text-[9px] font-black text-eduGreen-700 uppercase tracking-widest block">
                                                                                {cls.homeroomTeacher.name}
                                                                            </span>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2 relative z-10">
                                                                <Select
                                                                    onValueChange={(teacherId: string) => handleAssignHomeroom(cls.id, teacherId === "null" ? null : teacherId)}
                                                                    defaultValue={cls.homeroomTeacherId}
                                                                >
                                                                    <SelectTrigger className="w-32 h-9 rounded-lg bg-zinc-950/50 border-zinc-800 text-[9px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all">
                                                                        <SelectValue placeholder="Staff" />
                                                                    </SelectTrigger>
                                                                    <SelectContent className="bg-zinc-950 border-zinc-800 text-white">
                                                                        {allTeachers.map((t: any) => (
                                                                            <SelectItem key={t.id} value={t.id} className="focus:bg-eduGreen-900/20 focus:text-eduGreen-400 font-bold text-[10px] uppercase">
                                                                                {t.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                        <SelectItem value="null" className="focus:bg-red-900/20 focus:text-red-400 font-bold text-[10px] uppercase">No Staff</SelectItem>
                                                                    </SelectContent>
                                                                </Select>
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-10 w-10 rounded-xl text-zinc-800 hover:text-red-500 hover:bg-red-950/20 hover:border-red-900/30 border border-transparent transition-all"
                                                                    onClick={(e) => { e.stopPropagation(); handleDeleteClass(cls.id); }}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {isAddingClass === grade.id ? (
                                                        <form onSubmit={(e) => handleCreateClass(e, grade.id)} className="col-span-1 flex gap-2 animate-in fade-in duration-300">
                                                            <Input
                                                                autoFocus
                                                                placeholder="e.g. 10A"
                                                                value={newClassName}
                                                                onChange={e => setNewClassName(e.target.value)}
                                                                className="h-14 bg-zinc-900/50 border-zinc-800 border-2 text-white focus:border-eduGreen-600 rounded-2xl font-black px-6"
                                                            />
                                                            <Button size="icon" type="submit" isLoading={loading} className="h-14 w-14 bg-white text-black rounded-2xl shrink-0 active:scale-95 transition-all">
                                                                <ChevronRight className="w-5 h-5" />
                                                            </Button>
                                                        </form>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            className="h-full min-h-[5.5rem] rounded-[1.5rem] border-dashed border-2 border-zinc-800 hover:border-eduGreen-900/50 hover:bg-eduGreen-900/5 text-zinc-700 hover:text-eduGreen-500 flex flex-col gap-2 transition-all group/add"
                                                            onClick={() => setIsAddingClass(grade.id)}
                                                        >
                                                            <Plus className="w-5 h-5 group-hover/add:scale-110 transition-transform" />
                                                            <span className="text-[9px] font-black uppercase tracking-[0.2em]">Deploy Class</span>
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                {grades.length === 0 && !isAddingGrade && (
                                    <div className="p-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center opacity-20">
                                            <Layers className="w-8 h-8 text-white" />
                                        </div>
                                        <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">No academic layers configured</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Subjects Section */}
                <div className="space-y-8">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                        <CardHeader className="p-8 border-b border-zinc-900/80">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 bg-sky-950/20 rounded-xl border border-sky-900/30">
                                        <BookOpen className="w-4 h-4 text-sky-500" />
                                    </div>
                                    <CardTitle className="text-lg font-black text-white tracking-tight">Core Disciplines</CardTitle>
                                </div>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => setIsAddingSubject(true)}
                                    className="h-10 w-10 rounded-xl bg-zinc-950/50 border border-zinc-900 text-zinc-600 hover:text-sky-500 hover:border-sky-900/30 transition-all"
                                >
                                    <Plus className="w-4 h-4" />
                                </Button>
                            </div>
                            <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px]">Academic Subject Registry</CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                            {isAddingSubject && (
                                <div className="p-6 bg-zinc-950/50 border-b border-zinc-900 animate-in slide-in-from-top-4 duration-500">
                                    <form onSubmit={handleCreateSubject} className="flex gap-2">
                                        <Input
                                            autoFocus
                                            placeholder="e.g. Mathematics"
                                            value={newSubjectName}
                                            onChange={e => setNewSubjectName(e.target.value)}
                                            className="h-12 bg-zinc-900/30 border-zinc-800 border-2 text-white focus:border-sky-600 rounded-xl font-bold px-4"
                                        />
                                        <Button size="icon" type="submit" isLoading={loading} className="h-12 w-12 bg-sky-600 hover:bg-sky-500 text-white rounded-xl shrink-0 active:scale-95 transition-all shadow-lg shadow-sky-900/20">
                                            <Check className="w-4 h-4" />
                                        </Button>
                                    </form>
                                </div>
                            )}
                            <div className="divide-y divide-zinc-900/80 max-h-[600px] overflow-y-auto custom-scrollbar">
                                {subjects.map((sub) => (
                                    <div key={sub.id} className="p-5 flex items-center justify-between hover:bg-sky-900/5 transition-all group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 group-hover:bg-sky-500 group-hover:shadow-[0_0_8px_rgba(14,165,233,0.5)] transition-all" />
                                            <span className="font-black text-sm text-zinc-400 group-hover:text-zinc-100 transition-colors tracking-tight">{sub.name}</span>
                                        </div>
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-9 w-9 rounded-lg text-zinc-800 hover:text-red-500 hover:bg-red-950/20 opacity-0 group-hover:opacity-100 transition-all"
                                            onClick={() => handleDeleteSubject(sub.id)}
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                    </div>
                                ))}
                                {subjects.length === 0 && !isAddingSubject && (
                                    <div className="p-16 text-center flex flex-col items-center gap-4 opacity-40">
                                        <BookOpen className="w-10 h-10 text-zinc-400" />
                                        <p className="text-zinc-600 font-black uppercase tracking-widest text-[9px]">No subjects registered</p>
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
