"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User, Calendar, MapPin, Phone, Clock, AlertTriangle, Sparkles } from "lucide-react";
import { SpringingLoader } from "@/components/dashboard/springing-loader";

export default function StudentVerificationPage() {
    const { studentId } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Using the report-card endpoint for now as it contains the required data.
                // In a real scenario, this might be a specialized public verification endpoint.
                const res = await fetch(`/api/school/students/${studentId}/report-card`);
                if (!res.ok) throw new Error("Verification Failed: Entity not found or access denied.");
                const result = await res.json();
                setData(result);
            } catch (e: any) {
                console.error(e);
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><SpringingLoader message="Authenticating Identity Credentials" /></div>;

    if (error || !data?.student) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black p-6">
                <Card className="max-w-md w-full bg-zinc-950 border-rose-900/50 rounded-[2.5rem] p-8 text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-950/20 rounded-full flex items-center justify-center mx-auto border border-rose-900/30">
                        <AlertTriangle className="w-10 h-10 text-rose-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-white italic uppercase">Access Denied</h1>
                        <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest mt-2">{error || "Neural Link Severed"}</p>
                    </div>
                </Card>
            </div>
        );
    }

    const { student, attendance } = data;
    const attendancePercentage = attendance.total > 0 ? Math.round((attendance.present / attendance.total) * 100) : 0;

    return (
        <div className="min-h-screen bg-black py-12 px-6">
            <div className="max-w-md mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">

                {/* Verification Header */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="px-5 py-2 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-eduGreen-500" />
                        <span className="text-[10px] font-black text-eduGreen-500 uppercase tracking-[0.2em]">Validated Identity Node</span>
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
                            Identity <span className="text-eduGreen-500">Verified</span>
                        </h1>
                        <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">{student.school?.name}</p>
                    </div>
                </div>

                {/* Main Profile Card */}
                <Card className="bg-zinc-950/40 backdrop-blur-3xl border-zinc-900 rounded-[3rem] overflow-hidden shadow-2xl relative">
                    <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-eduGreen-950/20 to-transparent opacity-50" />

                    <CardContent className="p-10 relative z-10 flex flex-col items-center text-center">
                        {/* Photo */}
                        <div className="w-32 h-32 rounded-[2.5rem] bg-zinc-900 border-2 border-eduGreen-900/30 mb-6 overflow-hidden shadow-2xl">
                            {student.photoUrl ? (
                                <img src={student.photoUrl} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-zinc-800">
                                    {student.firstName[0]}{student.lastName[0]}
                                </div>
                            )}
                        </div>

                        {/* Name & ID */}
                        <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-tight mb-1">
                            {student.firstName} {student.lastName}
                        </h2>
                        <div className="text-zinc-500 font-mono text-sm mb-8 tracking-tighter">
                            ID: {student.studentCode}
                        </div>

                        {/* Vitals Grid */}
                        <div className="w-full grid grid-cols-2 gap-4">
                            <div className="p-5 bg-zinc-900/50 rounded-3xl border border-zinc-900 flex flex-col items-center">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Grade Level</span>
                                <span className="text-sm font-bold text-white uppercase">{student.class?.grade?.name || "N/A"}</span>
                            </div>
                            <div className="p-5 bg-zinc-900/50 rounded-3xl border border-zinc-900 flex flex-col items-center">
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mb-1">Status</span>
                                <span className="text-sm font-bold text-eduGreen-500 uppercase flex items-center gap-1">
                                    <div className="w-1.5 h-1.5 rounded-full bg-eduGreen-500 animate-pulse" />
                                    Active
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Secondary Stats */}
                <div className="grid gap-6">
                    <Card className="bg-zinc-950/40 border-zinc-900 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                <Clock className="w-5 h-5 text-eduGreen-500" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Attendance Metric</h3>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Session Engagement Rate</p>
                            </div>
                        </div>
                        <div className="flex items-end justify-between gap-4">
                            <div className="flex-1">
                                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-eduGreen-500 shadow-[0_0_15px_rgba(59,214,141,0.5)] transition-all duration-1000"
                                        style={{ width: `${attendancePercentage}%` }}
                                    />
                                </div>
                            </div>
                            <span className="text-2xl font-black text-white italic">{attendancePercentage}%</span>
                        </div>
                    </Card>

                    <Card className="bg-zinc-950/40 border-zinc-900 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                <Phone className="w-5 h-5 text-eduGreen-500" />
                            </div>
                            <div>
                                <h3 className="text-xs font-black text-white uppercase tracking-widest">Emergency Contact</h3>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Primary Guardian Uplink</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Guardian</span>
                                <span className="text-xs font-bold text-white uppercase">{student.guardianName || "N/A"}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Frequency</span>
                                <span className="text-xs font-bold text-eduGreen-500">{student.guardianPhone || "N/A"}</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Footer */}
                <div className="text-center opacity-20 py-8">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-white" />
                        <span className="text-[10px] font-black text-white uppercase tracking-[0.3em]">LUCY SECURITY SYSTEM</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
