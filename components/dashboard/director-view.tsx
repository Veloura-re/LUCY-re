"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, BarChart3, Users, GraduationCap, BookOpen, Calendar, DollarSign, Settings, Bell, Search, Sparkles, School, Clock, MessageSquare, Shield, Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UpcomingEventsWidget } from "./upcoming-events";

export function DirectorView({ user, school: initialSchool }: { user: any, school: any }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // School Creation State
    const [schoolName, setSchoolName] = useState("");
    const [schoolCode, setSchoolCode] = useState("");
    const [institutionalMetrics, setInstitutionalMetrics] = useState({
        avgAttendance: "...",
        examCompletion: "...",
        recentEvents: 0
    });

    useEffect(() => {
        if (initialSchool) {
            fetch('/api/school/analytics')
                .then(res => res.json())
                .then(data => {
                    if (data.summary) {
                        setInstitutionalMetrics(prev => ({
                            ...prev,
                            avgAttendance: data.summary.avgAttendance,
                            examCompletion: data.summary.examCompletion,
                            recentEvents: data.summary.recentEvents
                        }));
                    }
                })
                .catch(err => console.error("Pulse fetch error:", err));
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

    // --- DASHBOARD VIEW ---
    const stats = [
        { label: "Total Students", value: initialSchool?._count?.students || 0, icon: GraduationCap, color: "text-eduGreen-500", desc: "Active Learners" },
        { label: "Total Staff", value: initialSchool?._count?.users || 1, icon: Users, color: "text-emerald-500", desc: "Academic Team" },
        { label: "Active Classes", value: initialSchool?._count?.grades || 0, icon: BookOpen, color: "text-eduGreen-400", desc: "Digital Rooms" },
        { label: "Recent Events", value: initialSchool?._count?.events || 0, icon: Calendar, color: "text-emerald-400", desc: "School Timeline" },
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
                <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shadow-2xl mb-1">
                    <button className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-eduGreen-600 text-white shadow-lg shadow-eduGreen-900/20">Real-time</button>
                    <button className="px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-all">Historical</button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {stats.map((stat, i) => (
                    <Card key={i} className="bg-zinc-950/20 border-zinc-900 rounded-3xl p-8 hover:border-eduGreen-900/30 transition-all border-t-zinc-800/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-2">{stat.label}</p>
                        <p className="text-4xl font-black text-white">{stat.value}</p>
                        <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest mt-2">{stat.desc}</p>
                    </Card>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Column (Main Stats / Chart placeholder) */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 hover:border-eduGreen-900/30 transition-all rounded-[2.5rem] overflow-hidden group shadow-2xl border-t-zinc-800/20">
                        <CardHeader className="p-10 pb-4 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black text-white tracking-tight leading-tight">Institutional Pulse</CardTitle>
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">Cross-departmental performance index</p>
                            </div>
                            <Activity className="w-5 h-5 text-eduGreen-500" />
                        </CardHeader>
                        <CardContent className="p-10 pt-0">
                            <div className="h-64 w-full bg-zinc-900/20 rounded-2xl border border-zinc-900 flex items-center justify-center relative overflow-hidden group/chart">
                                <div className="absolute inset-0 bg-gradient-to-t from-eduGreen-500/5 to-transparent opaicty-0 group-hover/chart:opacity-100 transition-opacity" />
                                <BarChart3 className="w-12 h-12 text-zinc-800 group-hover/chart:scale-110 transition-transform" />
                                <span className="absolute bottom-8 text-[10px] font-black text-zinc-700 uppercase tracking-widest italic">Live Neural Feed Active</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column (Side Widgets) */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 hover:border-eduGreen-900/30 transition-all rounded-[2.5rem] overflow-hidden group shadow-2xl border-t-zinc-800/20">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-white tracking-tight">System Integrity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Uplink</span>
                                <span className="text-[10px] font-black text-eduGreen-500 uppercase tracking-widest italic">Stable</span>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                <span className="text-[10px] font-bold text-zinc-500 uppercase">Latency</span>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">12ms</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 hover:border-eduGreen-900/30 transition-all rounded-[2.5rem] overflow-hidden group shadow-2xl border-t-zinc-800/20">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-white tracking-tight">Upcoming Engagements</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            <UpcomingEventsWidget />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );

}
