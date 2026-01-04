"use client";

import { useEffect, useState } from "react";
import { format, differenceInMinutes, addMinutes, isWithinInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    PlayCircle, Clock, Calendar, CheckCircle2, ChevronRight,
    BookOpen, BrainCircuit, Sparkles, ArrowRight, CreditCard
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { IDCardModal } from "@/components/dashboard/id-card-modal";
import { cn } from "@/lib/utils";

export default function StudentDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [showIDCard, setShowIDCard] = useState(false);

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch('/api/student/dashboard');
                const result = await res.json();
                setData(result);
            } catch (error) {
                console.error("Dashboard Sync Failed", error);
            } finally {
                setLoading(false);
            }
        };
        fetchDashboard();
    }, []);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    if (loading) return <SpringingLoader />;

    const activeLesson = data?.currentLesson;
    const stats = { attendance: data?.attendance };

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            <IDCardModal
                isOpen={showIDCard}
                onClose={() => setShowIDCard(false)}
                user={data?.student}
                type="STUDENT"
                schoolName={data?.student?.school?.name}
                schoolAddress={data?.student?.school?.address}
            />

            {/* Dynamic Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight italic uppercase">
                        Protocol <span className="text-eduGreen-500">Nexus</span>
                    </h1>
                    <p className="text-zinc-500 font-bold mt-2 text-xs uppercase tracking-widest">
                        System Status: <span className="text-eduGreen-500">Operational</span> • {format(currentTime, 'eeee, MMMM do')}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        onClick={() => setShowIDCard(true)}
                        className="bg-zinc-900 hover:bg-zinc-800 text-white border border-zinc-800 rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest gap-2"
                    >
                        <CreditCard className="w-4 h-4" /> My Digital ID
                    </Button>
                    <div className="px-5 py-3 bg-zinc-900/50 border border-zinc-900 rounded-2xl flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-eduGreen-500 animate-pulse" />
                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Live: {activeLesson?.subject || "Standby Mode"}</span>
                    </div>
                </div>
            </div>

            {/* Live Lesson/Next Up Billboard */}
            {activeLesson ? (
                <Card className="relative overflow-hidden bg-eduGreen-600 border-eduGreen-500 rounded-[3rem] shadow-2xl shadow-eduGreen-900/40 border-t-white/10 group">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50" />
                    <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />

                    <CardContent className="p-12 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-10">
                        <div className="space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30 text-[10px] font-black text-white uppercase tracking-widest">
                                <PlayCircle className="w-3 h-3" /> Session In Progress
                            </div>
                            <div>
                                <h2 className="text-5xl font-black text-white tracking-tighter italic uppercase">{activeLesson.subject}</h2>
                                <p className="text-eduGreen-100 font-bold text-sm mt-2 uppercase tracking-[0.3em]">{activeLesson.period} • {activeLesson.teacher}</p>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="space-y-1">
                                    <p className="text-white/60 text-[8px] font-black uppercase tracking-widest">Ends At</p>
                                    <p className="text-white font-black text-xl">{activeLesson.endTime ? format(new Date(activeLesson.endTime), 'HH:mm') : "--:--"}</p>
                                </div>
                                <div className="h-10 w-[1px] bg-white/20" />
                                <div className="space-y-1">
                                    <p className="text-white/60 text-[8px] font-black uppercase tracking-widest">Current Topic</p>
                                    <p className="text-white font-black text-xl">{activeLesson.topic}</p>
                                </div>
                            </div>
                        </div>
                        <Button className="bg-white hover:bg-zinc-100 text-eduGreen-700 h-20 px-12 rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] transition-all hover:scale-105 active:scale-95 shadow-2xl">
                            Enter Session
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <Card className="relative overflow-hidden bg-zinc-900/50 border-zinc-800 rounded-[3rem] shadow-2xl border-t-zinc-700/20 group backdrop-blur-3xl">
                    <CardContent className="p-12 text-center space-y-6">
                        <div className="w-20 h-20 bg-zinc-950 border border-zinc-800 rounded-[2rem] flex items-center justify-center mx-auto mb-4 group-hover:border-eduGreen-500 transition-colors">
                            <Clock className="w-10 h-10 text-zinc-800 group-hover:text-eduGreen-500 transition-colors" />
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase italic">Transit Interval</h2>
                        <p className="text-zinc-500 font-bold text-xs uppercase tracking-[0.4em]">Next Class Begins Soon</p>
                    </CardContent>
                </Card>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link href="/dashboard/student/grades" className="block">
                    <Card className="bg-zinc-950/40 border-zinc-900 hover:border-eduGreen-500/30 transition-all group overflow-hidden relative h-full">
                        <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-100 transition-opacity">
                            <Sparkles className="w-4 h-4 text-eduGreen-500 animate-pulse" />
                        </div>
                        <CardContent className="p-6 flex items-center gap-4">
                            <div className="p-3 bg-zinc-900 rounded-xl group-hover:bg-eduGreen-900/20 transition-colors">
                                <BrainCircuit className="w-5 h-5 text-eduGreen-500" />
                            </div>
                            <div>
                                <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Cognitive Feed</p>
                                <h4 className="text-white font-bold text-lg">Neural Insights</h4>
                                <p className="text-eduGreen-500 text-[10px] font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                                    Check AI Feedback <ArrowRight className="w-3 h-3" />
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="bg-zinc-950/40 border-zinc-900 hover:border-eduGreen-500/30 transition-all group overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-zinc-900 rounded-xl group-hover:bg-eduGreen-900/20 transition-colors">
                            <CheckCircle2 className="w-5 h-5 text-zinc-400 group-hover:text-eduGreen-400" />
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Attendance</p>
                            <h4 className="text-white font-bold text-lg">{stats?.attendance ? stats.attendance.toFixed(1) : "100"}%</h4>
                            <p className="text-zinc-500 text-xs font-bold mt-1 uppercase tracking-widest">Elite Standing</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950/40 border-zinc-900 hover:border-eduGreen-500/30 transition-all group overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-zinc-900 rounded-xl group-hover:bg-eduGreen-900/20 transition-colors">
                            <Calendar className="w-5 h-5 text-zinc-400 group-hover:text-eduGreen-400" />
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Next Exam</p>
                            <h4 className="text-white font-bold text-lg">{data?.nextExam ? data.nextExam.subject : "Standby"}</h4>
                            <div className="text-eduGreen-500 text-[10px] font-bold mt-1 uppercase tracking-widest flex items-center gap-1">
                                {data?.nextExam ? `${data.nextExam.title} • ${format(new Date(data.nextExam.date), 'MMM dd')}` : "All Clear"}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
