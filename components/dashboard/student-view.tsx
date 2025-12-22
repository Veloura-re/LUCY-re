"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
    GraduationCap,
    BookOpen,
    Calendar,
    Sparkles,
    ArrowRight,
    Trophy,
    Clock,
    BarChart3,
    Target,
    LayoutDashboard,
    MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { SpringingLoader } from "./springing-loader";
import { UpcomingEventsWidget } from "./upcoming-events";

interface StudentProps {
    user: any;
}

export function StudentView({ user }: StudentProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [studentData, setStudentData] = useState<any>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/user/stats');
                const data = await res.json();
                setStudentData(data);
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center">
                <SpringingLoader message="Initializing High-Bandwidth Interface" />
            </div>
        );
    }

    const stats = [
        { label: "Academic GPA", value: studentData?.gpa || "0.0", icon: Trophy, color: "text-amber-500", trend: "Active" },
        { label: "Attendance", value: `${Math.round(studentData?.attendanceRate || 100)}%`, icon: Target, color: "text-eduGreen-500", trend: "Live" },
        { label: "Assigned Units", value: studentData?.subjectStats?.length || "0", icon: BookOpen, color: "text-blue-500", trend: "Sync" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Student <span className="text-eduGreen-500 italic">Nexus</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Active Institutional Uplink & Neural Terminal</p>
                </div>

                <div className="flex items-center gap-3 mb-1">
                    <Link href="/dashboard/messages">
                        <Button variant="outline" className="rounded-2xl border-zinc-900 bg-zinc-950/50 hover:border-eduGreen-500/30 transition-all h-14 px-6 font-bold text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white">
                            <MessageSquare className="mr-2 h-4 w-4" /> Secure Comms
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 hover:border-eduGreen-500/30 transition-all duration-1000 overflow-hidden group border-t-zinc-800/10 shadow-2xl rounded-[2.5rem]">
                        <div className="absolute inset-0 bg-gradient-to-br from-eduGreen-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0 relative z-10 px-8 pt-8">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 group-hover:text-eduGreen-500 transition-colors">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className={cn("h-4 w-4 transition-all group-hover:scale-110", stat.color)} />
                        </CardHeader>
                        <CardContent className="relative z-10 px-8 pb-8">
                            <div className="text-4xl font-black text-white mb-2 tracking-tighter">{stat.value}</div>
                            <div className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest flex items-center gap-2">
                                <span className={cn(stat.trend.startsWith('+') ? "text-emerald-500" : "text-zinc-700")}>{stat.trend}</span>
                                <span className="text-[7px]">Institutional Sync Active</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Courses / Subjects */}
                    <Card className="bg-zinc-950/30 backdrop-blur-2xl border-zinc-900 rounded-[2.5rem] overflow-hidden border-t-zinc-800/10 shadow-2xl">
                        <CardHeader className="p-10 border-b border-zinc-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className="p-4 bg-eduGreen-950/20 rounded-2xl border border-eduGreen-900/30">
                                        <BookOpen className="w-6 h-6 text-eduGreen-500" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-black text-white tracking-tight leading-none">Intelligence Metrics</CardTitle>
                                        <CardDescription className="text-[9px] font-black uppercase tracking-widest text-zinc-600 mt-2">Active Subject Enrollment</CardDescription>
                                    </div>
                                </div>
                                <Button variant="ghost" className="text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white group">
                                    View Curriculum <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="grid gap-6">
                                {studentData?.subjectStats?.map((subject: any, idx: number) => (
                                    <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between p-7 bg-zinc-900/30 rounded-[2rem] border border-zinc-900 group hover:border-eduGreen-900/30 transition-all gap-8">
                                        <div className="flex items-center gap-5">
                                            <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center font-black text-eduGreen-500 shadow-xl group-hover:border-eduGreen-900/20 transition-all">
                                                {subject.name[0]}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-white text-lg tracking-tight">{subject.name}</h4>
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{subject.teacher}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-1">Mean Grade</p>
                                                <p className="text-xl font-black text-eduGreen-500">{subject.gradeLabel}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-1">Performance</p>
                                                <p className="text-xl font-black text-white">{Math.round(subject.avgGrade)}%</p>
                                            </div>
                                            <Button size="icon" variant="ghost" className="text-zinc-800 hover:text-white hover:bg-zinc-900 rounded-xl transition-all">
                                                <ArrowRight className="w-5 h-5" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                                {(studentData?.subjectStats?.length || 0) === 0 && (
                                    <div className="text-center py-20 text-zinc-800 font-black uppercase tracking-[0.3em]">No Academic Units Linked</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar area */}
                <div className="lg:col-span-4 space-y-8">
                    {/* My Schedule Preview */}
                    <Card className="bg-zinc-950/30 backdrop-blur-2xl border-zinc-900 rounded-[2.5rem] overflow-hidden border-t-zinc-800/10 shadow-2xl">
                        <CardHeader className="p-10 pb-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-4 h-4 text-eduGreen-500" />
                                <CardTitle className="text-xs font-black text-white uppercase tracking-widest">Upcoming Session</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="px-10 pb-10">
                            {studentData?.nextSession ? (
                                <div className="p-6 bg-eduGreen-600 rounded-[2rem] border border-eduGreen-500/50 shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:scale-150 transition-transform duration-700" />
                                    <div className="relative z-10">
                                        <div className="text-[9px] font-black text-eduGreen-200 uppercase tracking-[0.2em] mb-4 leading-none">
                                            {studentData.nextSession.startsIn < 60
                                                ? `Starting in ${studentData.nextSession.startsIn} Minutes`
                                                : `Starts at ${studentData.nextSession.startTime}`}
                                        </div>
                                        <h4 className="text-xl font-black text-white tracking-tight leading-tight">{studentData.nextSession.subjectName}</h4>
                                        <div className="flex items-center gap-2 text-eduGreen-200 text-[10px] font-bold mt-3 uppercase tracking-widest">
                                            <LayoutDashboard className="w-3.5 h-3.5" />
                                            <span>Room {studentData.nextSession.room}</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 bg-zinc-900/30 rounded-3xl border border-dashed border-zinc-800 text-center">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">No Sessions Imminent</p>
                                </div>
                            )}
                            <Link href="/dashboard/student/timetable">
                                <Button variant="ghost" className="w-full mt-8 text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white group">
                                    Full Matrix <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
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
