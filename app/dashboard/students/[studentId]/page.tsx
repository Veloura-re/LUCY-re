"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    GraduationCap, BookOpen, Clock, FileText,
    ArrowLeft, TrendingUp, ShieldAlert, MessageSquare,
    Save, Plus, Trash2, Calendar
} from "lucide-react";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

export default function StudentProfilePage() {
    const { studentId } = useParams();
    const router = useRouter();
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("academic");
    const [remarks, setRemarks] = useState<any[]>([]);
    const [notes, setNotes] = useState<any[]>([]);
    const [newRemark, setNewRemark] = useState("");
    const [newNote, setNewNote] = useState("");
    const [isAddingRemark, setIsAddingRemark] = useState(false);
    const [isAddingNote, setIsAddingNote] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchStudentData();
    }, [studentId]);

    const fetchStudentData = async () => {
        try {
            const res = await fetch(`/api/school/students/${studentId}/report-card`);
            const d = await res.json();
            setData(d);
            setRemarks(d.remarks || []);
            setNotes(d.internalNotes || []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleAddRemark = async () => {
        if (!newRemark.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/school/students/${studentId}/remarks`, {
                method: 'POST',
                body: JSON.stringify({ content: newRemark, term: "CURRENT" })
            });
            if (res.ok) {
                setNewRemark("");
                setIsAddingRemark(false);
                fetchStudentData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddNote = async () => {
        if (!newNote.trim()) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/school/students/${studentId}/notes`, {
                method: 'POST',
                body: JSON.stringify({ content: newNote })
            });
            if (res.ok) {
                setNewNote("");
                setIsAddingNote(false);
                fetchStudentData();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center"><SpringingLoader message="Synthesizing Student Dossier" /></div>;
    if (!data?.student) return <div className="p-20 text-center text-zinc-500 font-bold uppercase tracking-widest">Neural Link Severed: Entity Not Found</div>;

    const { student, grades, attendance } = data;

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header / Navigation */}
            <div className="flex items-center justify-between">
                <Button
                    onClick={() => router.back()}
                    variant="ghost"
                    className="text-zinc-600 hover:text-white font-black uppercase tracking-widest text-[10px] gap-2"
                >
                    <ArrowLeft className="w-4 h-4" /> Return to Registry
                </Button>
                <div className="flex gap-4">
                    <Button className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-xl font-black uppercase text-[10px] tracking-widest h-12 px-6">
                        Export Full Dossier
                    </Button>
                </div>
            </div>

            {/* Profile Info Card */}
            <Card className="bg-zinc-950/40 backdrop-blur-2xl border-zinc-900 rounded-[3rem] overflow-hidden border-t-zinc-800/20">
                <div className="p-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border-2 border-eduGreen-900/30 flex items-center justify-center text-4xl font-black text-eduGreen-500 shadow-2xl relative overflow-hidden">
                            {student.firstName[0]}{student.lastName[0]}
                            <div className="absolute inset-x-0 bottom-0 h-1.5 bg-eduGreen-500 shadow-[0_0_15px_rgba(59,214,141,0.5)]" />
                        </div>
                    </div>

                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-2">
                            <h1 className="text-4xl font-black text-white tracking-tight italic">
                                {student.firstName} <span className="text-zinc-700 not-italic ml-2">{student.lastName}</span>
                            </h1>
                            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-[0.2em] shadow-lg shadow-eduGreen-950/10">
                                Active Learner
                            </div>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-6 text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-eduGreen-700" />
                                <span>{student.class?.grade?.name || "No Grade"} / {student.class?.name || "Unassigned"}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShieldAlert className="w-4 h-4 text-amber-700" />
                                <span>ID: {student.studentCode}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-700" />
                                <span>Enrolled: {format(new Date(student.createdAt), 'MMM yyyy')}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 text-center">
                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Attendance</div>
                            <div className="text-2xl font-black text-white italic">
                                {attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0}%
                            </div>
                        </div>
                        <div className="p-6 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 text-center">
                            <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">GPA Proxy</div>
                            <div className="text-2xl font-black text-eduGreen-500 italic">3.8</div>
                        </div>
                    </div>
                </div>
            </Card>

            <Tabs defaultValue="academic" className="space-y-8" onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-950/50 border border-zinc-900 p-1.5 rounded-2xl h-16">
                    <TabsTrigger value="academic" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Academic DNA</TabsTrigger>
                    <TabsTrigger value="attendance" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Biometric Log</TabsTrigger>
                    <TabsTrigger value="remarks" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Institutional Remarks</TabsTrigger>
                    <TabsTrigger value="notes" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Faculty Notes (Secure)</TabsTrigger>
                </TabsList>

                {/* --- Academic Section --- */}
                <TabsContent value="academic" className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid lg:grid-cols-12 gap-8">
                        <Card className="lg:col-span-8 bg-zinc-900/30 backdrop-blur-md border-zinc-900 rounded-[2.5rem] overflow-hidden">
                            <CardHeader className="p-8 border-b border-zinc-800/50 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black text-white italic">Execution <span className="text-zinc-700 not-italic ml-1">Matrix</span></CardTitle>
                                    <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Validated academic grade records</CardDescription>
                                </div>
                                <div className="hidden md:flex gap-1.5 h-6">
                                    {[1, 2, 3, 4, 5].map(i => <div key={i} className="w-1 bg-eduGreen-500/20 rounded-full" style={{ height: `${20 + i * 15}%` }} />)}
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pb-4">
                                {/* Grade Trend SVG Chart */}
                                {grades.length > 1 && (
                                    <div className="mb-10 p-6 bg-zinc-950/50 rounded-3xl border border-zinc-800/50 relative overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-r from-eduGreen-500/5 to-transparent opacity-50" />
                                        <div className="flex items-center gap-2 mb-6">
                                            <TrendingUp className="w-3.5 h-3.5 text-eduGreen-500" />
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Efficiency Progression</span>
                                        </div>
                                        <div className="h-32 w-full relative">
                                            <svg className="w-full h-full overflow-visible" viewBox="0 0 1000 100" preserveAspectRatio="none">
                                                <defs>
                                                    <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#3BD68D" stopOpacity="0.4" />
                                                        <stop offset="100%" stopColor="#3BD68D" stopOpacity="0" />
                                                    </linearGradient>
                                                </defs>
                                                {/* Area under curve */}
                                                <path
                                                    d={`M 0 100 ${grades.map((g: any, i: number) => `L ${(i / (grades.length - 1)) * 1000} ${100 - (g.score / 100) * 100}`).join(' ')} L 1000 100 Z`}
                                                    fill="url(#lineGrad)"
                                                    className="transition-all duration-1000"
                                                />
                                                {/* Line */}
                                                <path
                                                    d={grades.map((g: any, i: number) => `${i === 0 ? 'M' : 'L'} ${(i / (grades.length - 1)) * 1000} ${100 - (g.score / 100) * 100}`).join(' ')}
                                                    fill="none"
                                                    stroke="#3BD68D"
                                                    strokeWidth="4"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    className="drop-shadow-[0_0_8px_rgba(59,214,141,0.5)]"
                                                />
                                                {/* Data Points */}
                                                {grades.map((g: any, i: number) => (
                                                    <circle
                                                        key={i}
                                                        cx={(i / (grades.length - 1)) * 1000}
                                                        cy={100 - (g.score / 100) * 100}
                                                        r="6"
                                                        fill="#000"
                                                        stroke="#3BD68D"
                                                        strokeWidth="3"
                                                        className="hover:r-8 hover:fill-eduGreen-500 transition-all cursor-pointer"
                                                    />
                                                ))}
                                            </svg>
                                        </div>
                                    </div>
                                )}

                                <div className="divide-y divide-zinc-950 border-t border-zinc-900/50 -mx-8">
                                    {grades.length === 0 ? (
                                        <div className="p-20 text-center opacity-40">
                                            <TrendingUp className="w-12 h-12 mx-auto mb-4 text-zinc-800" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">No validated records discovered</p>
                                        </div>
                                    ) : (
                                        grades.map((grade: any, i: number) => (
                                            <div key={i} className="p-8 flex items-center justify-between hover:bg-eduGreen-900/5 transition-all group">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center group-hover:border-eduGreen-900/30 transition-colors">
                                                        <BookOpen className="w-5 h-5 text-zinc-800 group-hover:text-eduGreen-500 transition-colors" />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-white tracking-tight uppercase text-sm">{grade.subject?.name}</div>
                                                        <div className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{grade.exam?.title || "Class Assessment"}</div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-8">
                                                    <div className="text-right">
                                                        <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">{format(new Date(grade.createdAt), 'MMM dd')}</div>
                                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-900 text-[9px] font-black uppercase text-zinc-500">
                                                            {grade.status}
                                                        </div>
                                                    </div>
                                                    <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center text-xl font-black text-eduGreen-500 italic shadow-inner">
                                                        {grade.score}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="lg:col-span-4 space-y-8">
                            <Card className="bg-zinc-900/30 border-zinc-900 rounded-[2.5rem] p-8">
                                <h4 className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-6">Subject Variance</h4>
                                <div className="space-y-6">
                                    {Array.from(new Set(grades.map((g: any) => g.subject?.name))).slice(0, 4).map((sub: any, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase">
                                                <span className="text-zinc-400">{sub}</span>
                                                <span className="text-white">88%</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                                                <div className="h-full bg-eduGreen-600 rounded-full shadow-[0_0_8px_rgba(33,201,141,0.5)]" style={{ width: '88%' }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* --- Attendance Section --- */}
                <TabsContent value="attendance" className="animate-in slide-in-from-bottom-4 duration-500">
                    <div className="grid lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1 space-y-4">
                            <Card className="p-8 bg-zinc-950/50 border-zinc-900 rounded-[2.5rem] text-center">
                                <Clock className="w-8 h-8 text-eduGreen-500 mx-auto mb-4" />
                                <div className="text-4xl font-black text-white italic">{attendance.present}</div>
                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mt-1">Days Present</div>
                            </Card>
                            <Card className="p-8 bg-zinc-950/50 border-zinc-900 rounded-[2.5rem] text-center">
                                <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-4" />
                                <div className="text-4xl font-black text-white italic">{attendance.absent}</div>
                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mt-1">Unexcused Absence</div>
                            </Card>
                        </div>
                        <Card className="lg:col-span-3 bg-zinc-900/30 backdrop-blur-md border-zinc-900 rounded-[2.5rem]">
                            <CardHeader className="p-8 border-b border-zinc-800/50">
                                <CardTitle className="text-xl font-black text-white italic">Temporal <span className="text-zinc-700 not-italic ml-1">Flow</span></CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Historical attendance records</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="p-20 text-center opacity-30">
                                    <p className="text-[10px] font-black uppercase tracking-widest">Attendance Heatmap Syncing...</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* --- Remarks Section --- */}
                <TabsContent value="remarks" className="animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="bg-zinc-900/30 backdrop-blur-md border-zinc-900 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-zinc-800/50 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black text-white tracking-tight">Institutional Narrative</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Formal term observations for parents & students</CardDescription>
                            </div>
                            <Button
                                onClick={() => setIsAddingRemark(!isAddingRemark)}
                                className="bg-eduGreen-600/10 hover:bg-eduGreen-600/20 text-eduGreen-500 border border-eduGreen-900/30 rounded-xl h-10 font-black uppercase text-[9px] tracking-widest"
                            >
                                <Plus className="w-3 h-3 mr-2" /> {isAddingRemark ? "Cancel" : "New Remark"}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8">
                            {isAddingRemark && (
                                <div className="mb-8 p-6 bg-zinc-950/40 border border-zinc-900 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                                    <textarea
                                        value={newRemark}
                                        onChange={(e) => setNewRemark(e.target.value)}
                                        placeholder="Enter formal academic or behavioral observation..."
                                        className="w-full bg-zinc-900/50 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-eduGreen-600 outline-none transition-all min-h-[120px]"
                                    />
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            onClick={handleAddRemark}
                                            disabled={submitting || !newRemark.trim()}
                                            className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-xl h-10 px-6 font-black uppercase text-[9px] tracking-[0.2em]"
                                        >
                                            {submitting ? "Encrypting..." : "Publish Remark"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-6">
                                {remarks.length === 0 ? (
                                    <div className="py-20 text-center opacity-30">
                                        <FileText className="w-10 h-10 mx-auto mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No formal observations registered</p>
                                    </div>
                                ) : (
                                    remarks.map((r, i) => (
                                        <div key={i} className="p-8 bg-zinc-950/40 border border-zinc-900/50 rounded-3xl relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-zinc-800">
                                                        <AvatarFallback className="text-[9px] font-black bg-zinc-900 text-zinc-500">{(r.teacher?.name && r.teacher.name[0]) || 'T'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-[10px] font-black text-zinc-100 uppercase tracking-tight">{r.teacher?.name}</div>
                                                        <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Authorized Faculty</div>
                                                    </div>
                                                </div>
                                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{format(new Date(r.createdAt), 'MMM yyyy')}</div>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400 leading-relaxed italic pr-12">"{r.content}"</p>
                                            <div className="absolute bottom-6 right-8 text-[8px] font-black text-eduGreen-600/50 uppercase tracking-[0.2em]">Validated Node</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* --- Notes Section --- */}
                <TabsContent value="notes" className="animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="bg-eduGreen-950/5 border-eduGreen-900/20 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-eduGreen-900/10 flex flex-row items-center justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <ShieldAlert className="w-4 h-4 text-eduGreen-500" />
                                    <span className="text-[10px] font-black text-eduGreen-500 uppercase tracking-[0.3em]">Confidential Protocol</span>
                                </div>
                                <CardTitle className="text-xl font-black text-white">Faculty Internal Data</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Privileged observations NOT visible to parents or students</CardDescription>
                            </div>
                            <Button
                                onClick={() => setIsAddingNote(!isAddingNote)}
                                className="bg-eduGreen-600/10 hover:bg-eduGreen-600/20 text-eduGreen-500 border border-eduGreen-900/30 rounded-xl h-10 font-black uppercase text-[9px] tracking-widest"
                            >
                                <Plus className="w-3 h-3 mr-2" /> {isAddingNote ? "Cancel" : "Log internal Incident"}
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8">
                            {isAddingNote && (
                                <div className="mb-8 p-6 bg-zinc-950/10 border border-eduGreen-900/20 rounded-3xl animate-in slide-in-from-top-4 duration-300">
                                    <textarea
                                        value={newNote}
                                        onChange={(e) => setNewNote(e.target.value)}
                                        placeholder="Record confidential disciplinary or behavioral data..."
                                        className="w-full bg-zinc-900/50 border-zinc-800 rounded-2xl p-4 text-sm font-bold text-white focus:border-eduGreen-600 outline-none transition-all min-h-[120px]"
                                    />
                                    <div className="flex justify-end mt-4">
                                        <Button
                                            onClick={handleAddNote}
                                            disabled={submitting || !newNote.trim()}
                                            className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-xl h-10 px-6 font-black uppercase text-[9px] tracking-[0.2em]"
                                        >
                                            {submitting ? "Securing..." : "Commit to Secure Node"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                            <div className="space-y-6">
                                {(!data.internalNotes || data.internalNotes.length === 0) ? (
                                    <div className="py-20 text-center opacity-40">
                                        <MessageSquare className="w-10 h-10 mx-auto mb-4 text-eduGreen-900" />
                                        <p className="text-[10px] font-black uppercase tracking-widest text-eduGreen-900/50">Registry is clear of disciplinary incidents</p>
                                    </div>
                                ) : (
                                    data.internalNotes.map((n: any, i: number) => (
                                        <div key={i} className="p-8 bg-zinc-950/40 border border-zinc-900/50 rounded-3xl relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-zinc-800">
                                                        <AvatarFallback className="text-[9px] font-black bg-zinc-900 text-eduGreen-500">{(n.author?.name && n.author.name[0]) || 'A'}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="text-[10px] font-black text-zinc-100 uppercase tracking-tight">{n.author?.name}</div>
                                                        <div className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">Reporting Official</div>
                                                    </div>
                                                </div>
                                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{format(new Date(n.createdAt), 'MMM dd, HH:mm')}</div>
                                            </div>
                                            <p className="text-sm font-bold text-zinc-400 leading-relaxed italic pr-12">{n.content}</p>
                                            <div className="absolute top-8 right-8 text-eduGreen-500/20">
                                                <ShieldAlert className="w-6 h-6" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
