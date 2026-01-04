"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { BookOpen, Users, GraduationCap, ArrowRight, Sparkles, Plus, Calendar, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { UpcomingEventsWidget } from "./upcoming-events";

interface TeacherClass {
    id: string; // Assignment ID
    classId: string;
    className: string;
    subjectName: string;
    gradeLevel: number;
    studentCount: number;
    avgGrade?: number;
}

export function TeacherView({ user }: { user: any }) {
    const [classes, setClasses] = useState<TeacherClass[]>([]);
    const [exams, setExams] = useState<any[]>([]);
    const [attendanceSummary, setAttendanceSummary] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [classesRes, examsRes, analyticsRes] = await Promise.all([
                    fetch('/api/teacher/classes'),
                    fetch('/api/teacher/exams?recent=true'),
                    fetch('/api/teacher/analytics')
                ]);

                if (classesRes.ok) {
                    const data = await classesRes.json();
                    setClasses(data.classes);
                }

                if (examsRes.ok) {
                    const data = await examsRes.json();
                    setExams(data.exams?.slice(0, 3) || []);
                }

                if (analyticsRes.ok) {
                    const data = await analyticsRes.json();
                    setAttendanceSummary([
                        { label: "Attendance Rate", value: data.attendanceRate, trend: "Institutional Avg", color: "text-eduGreen-500" },
                        { label: "Missing Records", value: data.missingCount.toString(), trend: "Today", color: data.missingCount > 0 ? "text-red-500" : "text-zinc-500" }
                    ]);
                }

            } catch (error) {
                console.error("Failed to fetch dashboard data", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest mb-4">
                        <Sparkles className="w-3 h-3 text-eduGreen-500" />
                        <span>Command Console</span>
                    </div>
                    <h1 className="text-4xl font-black text-dm-textMain tracking-tight">Academic Nexus</h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm leading-relaxed max-w-2xl">
                        Manage class assignments, track student performance metrics, and orchestrate curriculum delivery.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link href="/dashboard/teacher/attendance">
                        <Button variant="outline" className="rounded-2xl border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 transition-all h-14 px-6 font-bold text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white">
                            <Calendar className="mr-2 h-4 w-4" /> Attendance
                        </Button>
                    </Link>
                    <Link href="/dashboard/teacher/exams">
                        <Button className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 transition-all active:scale-95">
                            <Plus className="mr-2 h-4 w-4" /> New Assignment
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-8 space-y-10">
                    {/* Maker Hub - New Section */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                        <Link href="/dashboard/teacher/exams/create" className="group">
                            <Card className="bg-eduGreen-600 border-eduGreen-500 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] active:scale-95 group-hover:shadow-eduGreen-900/40 relative">
                                <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-8 h-8 text-white" />
                                </div>
                                <CardContent className="p-8">
                                    <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Formal Registry</p>
                                    <h3 className="text-2xl font-black text-white italic">ADD EXAM</h3>
                                    <p className="text-white/80 text-[10px] font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                                        Initialize Schema <ArrowRight className="w-3 h-3" />
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>

                        <Link href="/dashboard/teacher/exams/create?mode=ai" className="group">
                            <Card className="bg-zinc-900 border-zinc-800 rounded-[2rem] overflow-hidden shadow-2xl transition-all hover:scale-[1.02] active:scale-95 group-hover:border-purple-500/50 relative">
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                                    <Sparkles className="w-8 h-8 text-purple-500" />
                                </div>
                                <CardContent className="p-8">
                                    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">Semantic Drafting</p>
                                    <h3 className="text-2xl font-black text-white italic uppercase">START WRITING</h3>
                                    <p className="text-purple-400 text-[10px] font-bold mt-2 uppercase tracking-widest flex items-center gap-2">
                                        Neural Synthesis <ArrowRight className="w-3 h-3" />
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    </div>

                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] bg-zinc-950/30 border border-zinc-900 border-dashed">
                            <Loader2 className="w-10 h-10 animate-spin text-eduGreen-600 mb-6" />
                            <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">Syncing academic grid...</p>
                        </div>
                    ) : classes.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 rounded-[3rem] bg-zinc-950/30 border-2 border-dashed border-zinc-900">
                            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center opacity-20 mb-8">
                                <BookOpen className="w-10 h-10 text-dm-textMain" />
                            </div>
                            <div className="text-center">
                                <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs">No Nodes Discovered</p>
                                <p className="text-zinc-800 text-[10px] font-bold uppercase tracking-widest mt-3 max-w-sm">Institutional assignments have not been established. Contact administration for grid access.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 gap-8">
                            {user.role === 'HOMEROOM' && (
                                <Card className="group relative bg-eduGreen-600 border-eduGreen-500 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-eduGreen-900/40 border-t-white/10">
                                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />

                                    <CardHeader className="p-8 pb-4 relative z-10">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="px-3 py-1.5 rounded-xl bg-white/20 border border-white/30 text-[9px] font-black text-white uppercase tracking-widest">
                                                Active Authority
                                            </div>
                                            <div className="p-3 bg-white/10 rounded-2xl border border-white/20 shadow-xl">
                                                <Users className="w-5 h-5 text-white" />
                                            </div>
                                        </div>
                                        <CardTitle className="text-3xl font-black text-white tracking-tight leading-tight">Homeroom Command</CardTitle>
                                        <p className="text-eduGreen-100 font-bold text-xs mt-2 uppercase tracking-widest">Register & Presence Console</p>
                                    </CardHeader>

                                    <CardContent className="p-8 pt-4 relative z-10">
                                        <p className="text-white/80 text-[10px] font-bold leading-relaxed uppercase">
                                            Execute daily attendance protocols and manage institutional presence for your assigned cohort.
                                        </p>
                                    </CardContent>

                                    <CardFooter className="p-8 pt-0 relative z-10">
                                        <Link href="/dashboard/homeroom" className="w-full">
                                            <Button className="w-full h-14 bg-white hover:bg-zinc-100 text-eduGreen-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all group/btn">
                                                Launch Console <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                            </Button>
                                        </Link>
                                    </CardFooter>
                                </Card>
                            )}
                            {classes.map((cls) => (
                                <Card key={cls.id} className="group relative bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 rounded-[2.5rem] overflow-hidden hover:border-eduGreen-900/40 transition-all border-t-zinc-800/20 shadow-2xl">
                                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-eduGreen-600 via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <CardHeader className="p-8 pb-4">
                                        <div className="flex items-start justify-between gap-4 mb-4">
                                            <div className="px-3 py-1.5 rounded-xl bg-eduGreen-950/20 border border-eduGreen-900/30 text-[9px] font-black text-eduGreen-500 uppercase tracking-widest">
                                                Class {cls.className}
                                            </div>
                                            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl group-hover:border-eduGreen-900/30 transition-colors">
                                                <BookOpen className="w-5 h-5 text-zinc-500 group-hover:text-eduGreen-500 transition-colors" />
                                            </div>
                                        </div>
                                        <CardTitle className="text-2xl font-black text-dm-textMain group-hover:text-dm-textMain transition-colors tracking-tight leading-tight">{cls.subjectName}</CardTitle>
                                        <div className="flex items-center gap-3 mt-2">
                                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Grade {cls.gradeLevel}</span>
                                            <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                            <span className="text-[9px] font-black text-eduGreen-800 uppercase tracking-tighter">Academic Sector</span>
                                        </div>
                                    </CardHeader>

                                    <CardContent className="p-8 pt-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="flex flex-col gap-1 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-900 group-hover:border-zinc-800 transition-all relative overflow-hidden">
                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest relative z-10">Capacity</span>
                                                <div className="flex items-center gap-2 relative z-10">
                                                    <Users className="w-4 h-4 text-eduGreen-700" />
                                                    <span className="text-lg font-black text-zinc-300 group-hover:text-white">{cls.studentCount} Students</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1 p-4 bg-zinc-950/50 rounded-2xl border border-zinc-900 group-hover:border-zinc-800 transition-all relative overflow-hidden">
                                                <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest relative z-10">Performance</span>
                                                <div className="flex items-center gap-2 relative z-10">
                                                    <GraduationCap className="w-4 h-4 text-eduGreen-700" />
                                                    <span className="text-lg font-black text-zinc-300 group-hover:text-white">
                                                        {cls.avgGrade ? `${Math.round(cls.avgGrade)}%` : 'N/A'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>

                                    <CardFooter className="p-8 pt-0">
                                        <Button className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-zinc-900 hover:border-zinc-700 transition-all group/btn">
                                            Initialize Protocol <ArrowRight className="ml-2 w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
                <div className="lg:col-span-4 space-y-10">
                    {/* Compact Tracking */}
                    <Card className="bg-zinc-950/40 backdrop-blur-md border-zinc-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="border-b border-zinc-900 pb-6">
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-eduGreen-500" /> Attendance Feed
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {attendanceSummary.map((stat, i) => (
                                <div key={i} className="flex justify-between items-center p-4 bg-zinc-900/30 rounded-2xl border border-zinc-900">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{stat.label}</span>
                                    <div className="text-right">
                                        <div className={cn("text-lg font-black", stat.color)}>{stat.value}</div>
                                        <div className="text-[8px] font-bold text-zinc-700 uppercase">{stat.trend}</div>
                                    </div>
                                </div>
                            ))}
                            <Link href="/dashboard/teacher/attendance">
                                <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-eduGreen-500 mt-2">
                                    Full Register <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    {/* Recent Exams */}
                    <Card className="bg-zinc-950/40 backdrop-blur-md border-zinc-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="border-b border-zinc-900 pb-6">
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-eduGreen-500" /> Recent Exams
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            {exams.length > 0 ? exams.map((exam) => (
                                <div key={exam.id} className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-900 hover:border-eduGreen-900/30 transition-all mb-3 group">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[9px] font-black text-eduGreen-700 uppercase tracking-widest">{exam.subject?.name}</span>
                                        <div className="flex items-center gap-2">
                                            <Link href={`/dashboard/teacher/exams/${exam.id}/editor`}>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-600 hover:text-purple-500">
                                                    <Sparkles className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                            <Link href={`/dashboard/teacher/gradebook/${exam.id}`}>
                                                <Button size="icon" variant="ghost" className="h-6 w-6 text-zinc-600 hover:text-eduGreen-500">
                                                    <Brain className="w-3.5 h-3.5" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </div>
                                    <div className="font-black text-sm text-white group-hover:text-eduGreen-500 transition-colors flex items-center justify-between">
                                        {exam.title}
                                        <Link href={`/dashboard/teacher/gradebook/${exam.id}`}>
                                            <ArrowRight className="w-3 h-3 text-zinc-800 group-hover:text-eduGreen-500 transition-all" />
                                        </Link>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-6">
                                    <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">No recent assessments</p>
                                </div>
                            )}
                            <Link href="/dashboard/teacher/exams">
                                <Button variant="ghost" className="w-full text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-eduGreen-500 mt-2">
                                    All Assessments <ArrowRight className="w-3 h-3 ml-2" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>

                    <UpcomingEventsWidget />
                </div>
            </div>
        </div>
    );
}
