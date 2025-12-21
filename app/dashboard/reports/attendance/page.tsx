"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Clock, TrendingUp, Users, Calendar,
    ArrowLeft, Filter, Download, Activity,
    UserCheck, UserX, UserMinus
} from "lucide-react";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { format, subDays } from "date-fns";

export default function AttendanceIntelligencePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
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

    if (loading) return <div className="min-h-screen flex items-center justify-center"><SpringingLoader message="Decrypting Temporal Attendance Vectors" /></div>;

    const summary = data?.summary || {};

    // Mock data for trend chart until more API endpoints are added
    const days = Array.from({ length: 14 }).map((_, i) => ({
        date: format(subDays(new Date(), 13 - i), 'MMM dd'),
        rate: 85 + Math.random() * 10
    }));

    return (
        <div className="space-y-10 animate-in fade-in duration-700 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <Button
                        onClick={() => router.back()}
                        variant="ghost"
                        className="text-zinc-600 hover:text-white font-black uppercase tracking-widest text-[10px] gap-2 mb-4 -ml-4"
                    >
                        <ArrowLeft className="w-4 h-4" /> Return to Intelligence
                    </Button>
                    <h1 className="text-4xl font-black text-white tracking-tight italic">Temporal <span className="text-zinc-700 not-italic ml-2">Attendance</span></h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm leading-relaxed max-w-2xl uppercase tracking-wider">
                        High-fidelity monitoring of institutional presence and engagement thresholds.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="rounded-2xl border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 transition-all h-14 px-6 font-bold text-[10px] uppercase tracking-widest text-zinc-500">
                        <Calendar className="mr-2 h-4 w-4" /> Past 30 Days
                    </Button>
                    <Button className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl">
                        <Download className="mr-2 h-4 w-4" /> Detailed Export
                    </Button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="bg-zinc-950/40 border-zinc-900 rounded-[2.5rem] p-8">
                    <div className="flex justify-between items-start mb-4">
                        <UserCheck className="w-6 h-6 text-eduGreen-500" />
                        <span className="text-[10px] font-black text-eduGreen-500 bg-eduGreen-900/10 px-2 py-1 rounded-lg">Target: 95%</span>
                    </div>
                    <div className="text-4xl font-black text-white tracking-tighter mb-1">{summary.avgAttendance}</div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Global Presence Rate</p>
                </Card>
                <Card className="bg-zinc-950/40 border-zinc-900 rounded-[2.5rem] p-8">
                    <div className="flex justify-between items-start mb-4">
                        <UserX className="w-6 h-6 text-red-500" />
                    </div>
                    <div className="text-4xl font-black text-white tracking-tighter mb-1">2.4%</div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Unexcused Absence Mean</p>
                </Card>
                <Card className="bg-zinc-950/40 border-zinc-900 rounded-[2.5rem] p-8">
                    <div className="flex justify-between items-start mb-4">
                        <Clock className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="text-4xl font-black text-white tracking-tighter mb-1">4.8%</div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Latency Variance (Late)</p>
                </Card>
                <Card className="bg-zinc-950/40 border-zinc-900 rounded-[2.5rem] p-8">
                    <div className="flex justify-between items-start mb-4">
                        <Activity className="w-6 h-6 text-cyan-500" />
                    </div>
                    <div className="text-4xl font-black text-white tracking-tighter mb-1">0.92</div>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Stability Coefficient</p>
                </Card>
            </div>

            {/* Charts Section */}
            <div className="grid lg:grid-cols-12 gap-8">
                <Card className="lg:col-span-8 bg-zinc-900/30 backdrop-blur-md border-zinc-900 rounded-[3rem] overflow-hidden border-t-zinc-800/20">
                    <CardHeader className="p-10 border-b border-zinc-800/50">
                        <CardTitle className="text-2xl font-black text-white italic">Neural <span className="text-zinc-700 not-italic ml-2">Presence Trend</span></CardTitle>
                        <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Institutional presence over time duration</CardDescription>
                    </CardHeader>
                    <CardContent className="p-10">
                        <div className="h-64 flex items-end gap-2">
                            {days.map((d, i) => (
                                <div key={i} className="flex-1 flex flex-col items-center gap-4 group">
                                    <div className="relative w-full">
                                        <div
                                            className="w-full bg-eduGreen-600/20 border-t-2 border-eduGreen-500 rounded-t-xl transition-all duration-700 group-hover:bg-eduGreen-500/40 shadow-[0_-5px_15px_rgba(33,201,141,0.1)]"
                                            style={{ height: `${d.rate}%` }}
                                        />
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-950 border border-zinc-800 px-2 py-1 rounded text-[8px] font-black text-white">
                                            {Math.round(d.rate)}%
                                        </div>
                                    </div>
                                    <span className="text-[8px] font-black text-zinc-800 uppercase tracking-tighter rotate-[-45deg] origin-top-left mt-2">{d.date}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-4 space-y-8">
                    <Card className="bg-zinc-900/40 border-zinc-900 rounded-[3.5rem] overflow-hidden flex flex-col items-center justify-center p-10 text-center relative">
                        <div className="absolute inset-0 bg-gradient-to-b from-eduGreen-500/5 to-transparent pointer-events-none" />
                        <div className="w-24 h-24 rounded-full border-4 border-zinc-900 border-t-eduGreen-500 animate-spin mb-6" />
                        <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Class <span className="text-zinc-600">Density</span></h4>
                        <p className="text-[9px] font-black text-zinc-600 mt-2 uppercase tracking-widest">Analyzing cluster variances...</p>
                    </Card>

                    <Card className="bg-zinc-950/50 border-zinc-900 rounded-[2.5rem] p-8">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">Top Outliers (Absences)</h4>
                        <div className="space-y-4">
                            {[
                                { name: "Class 10-A", rate: "12 Absences" },
                                { name: "Class 12-C", rate: "9 Absences" },
                                { name: "Class 9-B", rate: "7 Absences" }
                            ].map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800">
                                    <span className="text-[11px] font-black text-white uppercase">{item.name}</span>
                                    <span className="text-[10px] font-black text-red-500">{item.rate}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}

