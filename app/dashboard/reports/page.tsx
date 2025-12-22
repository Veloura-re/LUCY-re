"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, TrendingUp, Users, BookOpen, Download, Filter, Sparkles, ShieldCheck, ChevronRight, Activity } from "lucide-react";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function ReportsPage() {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchAnalytics();
    }, []);

    const fetchAnalytics = async () => {
        try {
            const res = await fetch('/api/school/analytics');
            const result = await res.json();
            setData(result);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <SpringingLoader message="Synthesizing Institutional Intelligence" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Predictive <span className="text-eduGreen-500 italic">Analytics</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Institutional Intelligence & Performance Synthesis</p>
                </div>

                <div className="flex items-center gap-4 mb-2">
                    <Button variant="outline" className="rounded-2xl border-zinc-900 bg-zinc-950/50 hover:border-eduGreen-500/30 transition-all h-12 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        <Filter className="w-4 h-4 mr-2" /> Filter Stream
                    </Button>
                    <Button className="bg-eduGreen-600 text-white hover:bg-eduGreen-500 h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 shadow-eduGreen-900/20">
                        <Download className="w-4 h-4 mr-2" /> Export Core
                    </Button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Link href="/dashboard/reports/attendance" className="block group">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900 rounded-[2.5rem] overflow-hidden group-hover:border-eduGreen-900/50 transition-all border-t-zinc-800/20 shadow-2xl">
                        <CardContent className="p-8">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 group-hover:border-eduGreen-900/30 transition-all">
                                    <TrendingUp className="w-5 h-5 text-eduGreen-500" />
                                </div>
                                <span className="text-[10px] font-black text-eduGreen-600 bg-eduGreen-950/20 px-2 py-1 rounded-full">+1.4%</span>
                            </div>
                            <div className="text-4xl font-black text-white mb-1 tracking-tighter">{data.summary?.avgAttendance || "100%"}</div>
                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest flex items-center justify-between">
                                Attendance Velocity
                                <ChevronRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Card className="bg-zinc-950/40 backdrop-blur-md border-zinc-900 rounded-[2.5rem] overflow-hidden group">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 group-hover:border-eduGreen-900/30 transition-all">
                                <BookOpen className="w-5 h-5 text-emerald-500" />
                            </div>
                            <span className="text-[10px] font-black text-eduGreen-600 bg-eduGreen-950/20 px-2 py-1 rounded-full">On Track</span>
                        </div>
                        <div className="text-4xl font-black text-white mb-1 tracking-tighter">{data.summary?.examCompletion || "0%"}</div>
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Syllabus Saturation</p>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950/40 backdrop-blur-md border-zinc-900 rounded-[2.5rem] overflow-hidden group">
                    <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800 group-hover:border-eduGreen-900/30 transition-all">
                                <Activity className="w-5 h-5 text-cyan-500" />
                            </div>
                            <span className="text-[10px] font-black text-eduGreen-600 bg-eduGreen-950/20 px-2 py-1 rounded-full">Steady</span>
                        </div>
                        <div className="text-4xl font-black text-white mb-1 tracking-tighter">{data.summary?.activeNodes || "0"}</div>
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest">Active Nodes</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Performance by Subject */}
                <Card className="lg:col-span-8 bg-zinc-950/40 backdrop-blur-xl border-zinc-900 rounded-[3rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                    <CardHeader className="p-10 border-b border-zinc-900/50">
                        <CardTitle className="text-2xl font-black text-white tracking-tight">Academic Performance Index</CardTitle>
                        <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Mean subject progression metrics</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="space-y-8">
                            {data?.performanceBySubject?.map((s: any, i: number) => (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span className="text-zinc-400">{s.name}</span>
                                        <span className="text-white">{s.avg?.toFixed(1) || 0}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                                        <div
                                            className="h-full bg-gradient-to-r from-eduGreen-600 to-emerald-400 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(20,122,82,0.3)]"
                                            style={{ width: `${s.avg || 0}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Faculty Load */}
                <Card className="lg:col-span-4 bg-zinc-950/40 backdrop-blur-xl border-zinc-900 rounded-[3rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                    <CardHeader className="p-8 border-b border-zinc-900/50">
                        <CardTitle className="text-lg font-black text-white tracking-tight uppercase tracking-widest text-[10px]">Faculty Overload Pulse</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="space-y-4">
                            {data?.teacherWorkload?.map((t: any, i: number) => (
                                <div key={i} className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-900 hover:border-eduGreen-900/30 transition-all flex items-center justify-between group">
                                    <div>
                                        <h5 className="font-black text-sm text-zinc-100 group-hover:text-white transition-colors">{t.name}</h5>
                                        <p className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">{t.periods} Weekly Periods</p>
                                    </div>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        t.periods > 25 ? "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]" : "bg-eduGreen-500 shadow-[0_0_10px_rgba(33,201,141,0.5)]"
                                    )} />
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-6 text-[9px] font-black uppercase tracking-widest text-zinc-600 hover:text-white group">
                            Full Resource Map <ChevronRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Alert */}
            <div className="p-10 bg-eduGreen-950/10 border border-eduGreen-900/20 rounded-[3rem] flex items-center gap-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-eduGreen-500/5 blur-3xl rounded-full" />
                <div className="w-20 h-20 rounded-[2rem] bg-zinc-950 border border-zinc-900 flex items-center justify-center shrink-0 shadow-2xl group-hover:scale-110 transition-transform">
                    <Sparkles className="w-10 h-10 text-eduGreen-500 animate-pulse" />
                </div>
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <ShieldCheck className="w-4 h-4 text-eduGreen-500" />
                        <h4 className="text-xs font-black text-white uppercase tracking-widest italic">Neural Insights <span className="not-italic opacity-40 ml-1">Beta</span></h4>
                    </div>
                    <p className="text-[10px] font-bold text-zinc-600 leading-relaxed uppercase max-w-2xl">
                        {data?.performanceBySubject?.length > 0 ? (
                            <>
                                AI-driven correlation identifies that <span className="text-white">
                                    {data.performanceBySubject.reduce((min: any, s: any) => (s.avg < min.avg ? s : min), data.performanceBySubject[0]).name}
                                </span> shows high variance this cycle. Institutional resource reallocation is suggested to stabilize performance.
                            </>
                        ) : (
                            "Institutional grid synchronization active. Real-time predictive metrics will appear once sufficient academic records are aggregated."
                        )}
                    </p>
                </div>
            </div>
        </div>
    );
}
