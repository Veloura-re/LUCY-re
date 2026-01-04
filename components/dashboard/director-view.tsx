"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, BarChart3, Users, GraduationCap, BookOpen, Calendar, DollarSign, Settings, Bell, Search, Sparkles, School, Clock, MessageSquare, Shield, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { UpcomingEventsWidget } from "./upcoming-events";

export function DirectorView({ user, school: initialSchool }: { user: any, school: any }) {
    const router = useRouter();
    const [viewMode, setViewMode] = useState<'realtime' | 'historical'>('realtime');
    const [analytics, setAnalytics] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    // School Creation State
    const [schoolName, setSchoolName] = useState("");
    const [schoolCode, setSchoolCode] = useState("");

    useEffect(() => {
        if (initialSchool) {
            fetch('/api/school/analytics')
                .then(res => res.json())
                .then(data => {
                    setAnalytics(data);
                    setIsLoading(false);
                })
                .catch(err => {
                    console.error("Pulse fetch error:", err);
                    setIsLoading(false);
                });
        }
    }, [initialSchool]);

    const handleCreateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/schools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: schoolName,
                    schoolCode: schoolCode,
                    domain: "" // Optional
                })
            });

            if (res.ok) {
                router.refresh(); // Reload to show the dashboard
            } else {
                alert("Failed to create school. School Code might be taken.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- ONBOARDING VIEW (No School Linked) ---
    if (!initialSchool) {
        return (
            <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
                <div className="border-b border-zinc-900 pb-10">
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        System <span className="text-eduGreen-500 italic">Initialization</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Advanced Institutional Setup Required</p>
                </div>

                <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 hover:border-eduGreen-900/30 transition-all rounded-[2.5rem] overflow-hidden group shadow-2xl border-t-zinc-800/20">
                    <CardHeader className="text-center pt-12 pb-8 px-12">
                        <CardTitle className="text-3xl font-black text-white tracking-tight">Deploy Organization</CardTitle>
                        <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-2 italic">Institutional Neural Network Creation</CardDescription>
                    </CardHeader>
                    <CardContent className="px-12 pb-12">
                        <form onSubmit={handleCreateSchool} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">School Identity</label>
                                <Input
                                    placeholder="e.g. Springfield Academy"
                                    value={schoolName}
                                    onChange={e => setSchoolName(e.target.value)}
                                    required
                                    icon={<School className="w-4 h-4 text-eduGreen-500" />}
                                    className="bg-zinc-900/30 border-zinc-800 text-white h-16 rounded-[1.5rem] focus:border-eduGreen-600 transition-all border-2 font-black uppercase text-sm"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Institutional Access Code</label>
                                <Input
                                    placeholder="e.g. SPRINGFIELD-001"
                                    value={schoolCode}
                                    onChange={e => setSchoolCode(e.target.value.toUpperCase())}
                                    required
                                    icon={<BookOpen className="w-4 h-4 text-eduGreen-500" />}
                                    className="font-mono uppercase bg-zinc-900/30 border-zinc-800 text-eduGreen-400 h-16 rounded-[1.5rem] focus:border-eduGreen-600 transition-all border-2 tracking-widest font-black"
                                />
                            </div>

                            <Button
                                className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 mt-4"
                                isLoading={isLoading}
                            >
                                Launch Ecosystem <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-zinc-950/20 border-t border-zinc-900/50 p-6 text-[9px] text-center text-zinc-700 font-black uppercase tracking-[0.3em] justify-center">
                        This sequence will bridge all scholarly nodes and faculty personnel.
                    </CardFooter>
                </Card>
            </div>
        );
    }

    const stats = [
        { label: "Total Students", value: analytics?.summary?.studentCount || 0, icon: GraduationCap, color: "text-eduGreen-500", desc: "Active Learners" },
        { label: "Total Staff", value: analytics?.summary?.studentCount ? (analytics.summary.studentCount / 10).toFixed(0) : 1, icon: Users, color: "text-emerald-500", desc: "Academic Team" },
        { label: "Active Classes", value: analytics?.summary?.classCount || 0, icon: BookOpen, color: "text-eduGreen-400", desc: "Digital Rooms" },
        { label: "Recent Events", value: analytics?.summary?.recentEvents || 0, icon: Calendar, color: "text-emerald-400", desc: "School Timeline" },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Institutional <span className="text-eduGreen-500 italic">Overview</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Consolidated Performance Analytics</p>
                </div>
                <div className="flex items-center gap-4">
                    <Link href="/dashboard/events">
                        <Button className="bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800 rounded-xl h-10 px-4 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3 h-3 text-eduGreen-500" />
                            Events Portal
                        </Button>
                    </Link>
                    <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shadow-2xl">
                        <button
                            onClick={() => setViewMode('realtime')}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                viewMode === 'realtime'
                                    ? "bg-eduGreen-600 text-white shadow-lg shadow-eduGreen-900/20"
                                    : "text-zinc-600 hover:text-white"
                            )}
                        >
                            Real-time
                        </button>
                        <button
                            onClick={() => setViewMode('historical')}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                viewMode === 'historical'
                                    ? "bg-eduGreen-600 text-white shadow-lg shadow-eduGreen-900/20"
                                    : "text-zinc-600 hover:text-white"
                            )}
                        >
                            Historical
                        </button>
                    </div>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'realtime' ? (
                    <motion.div
                        key="realtime"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-12"
                    >
                        {/* Quick Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            {stats.map((stat, i) => (
                                <Card key={i} className="bg-zinc-950/20 border-zinc-900 rounded-3xl p-8 hover:border-eduGreen-900/30 transition-all border-t-zinc-800/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <stat.icon className="w-12 h-12" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-2">{stat.label}</p>
                                    <p className="text-4xl font-black text-white">{stat.value}</p>
                                    <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest mt-2">{stat.desc}</p>
                                </Card>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            <div className="lg:col-span-8">
                                <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden group shadow-2xl border-t-zinc-800/20">
                                    <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-2xl font-black text-white tracking-tight">Institutional Pulse</CardTitle>
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">Key Performance Indices</p>
                                        </div>
                                        <Activity className="w-5 h-5 text-eduGreen-500" />
                                    </CardHeader>
                                    <CardContent className="p-10 pt-4 grid grid-cols-2 gap-6">
                                        <MetricNode
                                            label="Attendance Rate"
                                            value={analytics?.summary?.avgAttendance || "0%"}
                                            icon={<Activity className="w-4 h-4" />}
                                            percentage={parseFloat(analytics?.summary?.avgAttendance || "0")}
                                        />
                                        <MetricNode
                                            label="Exam Completion"
                                            value={analytics?.summary?.examCompletion || "0%"}
                                            icon={<BookOpen className="w-4 h-4" />}
                                            percentage={parseFloat(analytics?.summary?.examCompletion || "0")}
                                        />
                                        <MetricNode
                                            label="Recent Events"
                                            value={analytics?.summary?.recentEvents || 0}
                                            icon={<Calendar className="w-4 h-4" />}
                                        />
                                        <MetricNode
                                            label="Active Nodes"
                                            value={analytics?.summary?.activeNodes || 0}
                                            icon={<Users className="w-4 h-4" />}
                                        />
                                    </CardContent>
                                </Card>
                            </div>
                            <div className="lg:col-span-4">
                                <Card className="h-full bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden shadow-2xl border-t-zinc-800/20">
                                    <CardHeader className="p-8 pb-4">
                                        <CardTitle className="text-xl font-black text-white">Engagements</CardTitle>
                                    </CardHeader>
                                    <CardContent className="px-8 pb-8">
                                        <UpcomingEventsWidget />
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="historical"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="space-y-12"
                    >
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                            {/* Attendance Waveform */}
                            <div className="lg:col-span-7">
                                <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden shadow-2xl border-t-zinc-800/20">
                                    <CardHeader className="p-10 pb-2">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <CardTitle className="text-2xl font-black text-white">Attendance Waveform</CardTitle>
                                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">7-Day Scholar Presence Index</p>
                                            </div>
                                            <div className="px-3 py-1 bg-eduGreen-500/10 border border-eduGreen-500/20 rounded-lg">
                                                <span className="text-[10px] font-black text-eduGreen-500 uppercase tracking-widest italic">Live Trend</span>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-10 pt-8">
                                        <AttendanceWaveform data={analytics?.attendance || []} />
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Subject Power Bars */}
                            <div className="lg:col-span-5">
                                <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden shadow-2xl border-t-zinc-800/20 h-full">
                                    <CardHeader className="p-10 pb-4">
                                        <CardTitle className="text-xl font-black text-white">Subject Mastery</CardTitle>
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">Performance Distribution</p>
                                    </CardHeader>
                                    <CardContent className="px-10 pb-10 space-y-8">
                                        {analytics?.performanceBySubject?.length > 0 ? (
                                            analytics.performanceBySubject.map((s: any, i: number) => (
                                                <div key={i} className="space-y-3">
                                                    <div className="flex justify-between items-end">
                                                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{s.name}</span>
                                                        <span className="text-sm font-black text-white">{s.avg.toFixed(1)}%</span>
                                                    </div>
                                                    <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden border border-zinc-800/50">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${s.avg}%` }}
                                                            transition={{ duration: 1, delay: i * 0.1 }}
                                                            className="h-full bg-gradient-to-r from-eduGreen-600 to-eduGreen-400 shadow-[0_0_10px_rgba(20,184,115,0.3)]"
                                                        />
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-20 text-center text-[10px] font-black uppercase text-zinc-800 tracking-[0.3em]">No Data Uplink Found</div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

function MetricNode({ label, value, icon, percentage }: { label: string, value: string | number, icon: React.ReactNode, percentage?: number }) {
    return (
        <div className="p-8 bg-zinc-900/30 rounded-3xl border border-zinc-900 group/metric hover:border-eduGreen-900/30 transition-all relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-eduGreen-600/5 to-transparent opacity-0 group-hover/metric:opacity-100 transition-opacity" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em]">{label}</span>
                    <div className="text-zinc-700 bg-zinc-950 p-2 rounded-xl border border-zinc-900">{icon}</div>
                </div>

                <div className="flex items-end justify-between gap-4">
                    <div>
                        <div className="text-5xl font-black text-white mb-2 tracking-tighter">{value}</div>
                        <div className="text-[10px] font-black text-zinc-700 uppercase tracking-widest italic flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-eduGreen-500 animate-pulse" />
                            Live Telemetry
                        </div>
                    </div>

                    {percentage !== undefined && (
                        <div className="h-20 w-20 relative flex items-center justify-center">
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="40" cy="40" r="34"
                                    stroke="currentColor" strokeWidth="6"
                                    fill="transparent"
                                    className="text-zinc-900"
                                />
                                <motion.circle
                                    cx="40" cy="40" r="34"
                                    stroke="currentColor" strokeWidth="6"
                                    fill="transparent"
                                    strokeDasharray="213.6"
                                    initial={{ strokeDashoffset: 213.6 }}
                                    animate={{ strokeDashoffset: 213.6 - (Math.min(percentage, 100) / 100) * 213.6 }}
                                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                                    strokeLinecap="round"
                                    className="text-eduGreen-500 drop-shadow-[0_0_12px_rgba(20,184,115,0.6)]"
                                />
                            </svg>
                            <div className="absolute flex flex-col items-center">
                                <span className="text-[12px] font-black text-white leading-none">{Math.round(percentage)}</span>
                                <span className="text-[6px] font-black text-zinc-600 uppercase">Index</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function AttendanceWaveform({ data }: { data: any[] }) {
    if (!data.length) return <div className="h-64 flex items-center justify-center text-[10px] font-black text-zinc-800 uppercase tracking-widest">Awaiting Neural Link...</div>;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * 100;
        const y = 100 - d.percentage;
        return `${x},${y}`;
    }).join(" ");

    const areaPoints = `0,100 ${points} 100,100`;

    return (
        <div className="relative h-64 w-full group">
            <svg viewBox="0 0 100 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#14b873" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#14b873" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* Area Fill */}
                <motion.polyline
                    points={areaPoints}
                    fill="url(#waveGradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                />

                {/* Main Line */}
                <motion.polyline
                    points={points}
                    fill="none"
                    stroke="#14b873"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                />

                {/* Data Points */}
                {data.map((d, i) => (
                    <circle
                        key={i}
                        cx={(i / (data.length - 1)) * 100}
                        cy={100 - d.percentage}
                        r="1.5"
                        fill="#147A52"
                        className="hover:r-2 transition-all cursor-pointer shadow-lg"
                    />
                ))}
            </svg>

            {/* X-Axis Labels */}
            <div className="flex justify-between mt-6">
                {data.map((d, i) => (
                    <span key={i} className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                        {new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </span>
                ))}
            </div>
        </div>
    );
}
