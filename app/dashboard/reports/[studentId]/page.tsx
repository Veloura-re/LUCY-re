"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, GraduationCap, Printer, Download, Sparkles, User, Calendar, Award } from "lucide-react";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { cn } from "@/lib/utils";

export default function StudentReportCardPage() {
    const { studentId } = useParams();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/school/students/${studentId}/report-card`);
                const result = await res.json();
                setData(result);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [studentId]);

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-black"><SpringingLoader message="Compiling Academic Records" /></div>;
    if (!data?.student) return <div className="min-h-screen flex items-center justify-center text-zinc-500 font-black uppercase tracking-widest">Profile Discovery Failed</div>;

    const { student, grades, attendance, remarks } = data;

    const printReport = () => {
        window.print();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10 py-12">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10 print:hidden">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Report <span className="text-eduGreen-500 italic">Cycle</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">End of Term Scholastic Synthesis</p>
                </div>

                <div className="flex gap-4 mb-1">
                    <Button onClick={printReport} variant="outline" className="rounded-2xl border-zinc-900 bg-zinc-950/50 hover:border-eduGreen-500/30 transition-all h-12 px-6 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white">
                        <Printer className="w-4 h-4 mr-2" /> Print PDF
                    </Button>
                </div>
            </div>

            {/* Letterhead */}
            <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[3rem] overflow-hidden border-t-zinc-800/20 shadow-2xl print:border-none print:shadow-none print:bg-transparent">
                <CardContent className="p-10">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                        <div>
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="w-8 h-8 text-eduGreen-500" />
                                <h1 className="text-4xl font-black tracking-tighter italic uppercase">{student.school?.name}</h1>
                            </div>
                            <div className="space-y-1">
                                <p className="text-4xl font-black text-white print:text-black tracking-tighter">{student.firstName} {student.lastName}</p>
                                <p className="text-sm font-bold text-eduGreen-600 uppercase tracking-widest">{student.class?.grade?.name} • Room {student.class?.name}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-8 text-right md:text-right">
                            <div>
                                <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-1">Student Identifier</p>
                                <p className="font-mono text-xs text-zinc-400 print:text-zinc-600">{student.studentCode}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] mb-1">Academic Calendar</p>
                                <p className="font-mono text-xs text-zinc-400 print:text-zinc-600">2023/24 TERM 2</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid md:grid-cols-12 gap-12">
                {/* Academic Breakdown */}
                <div className="md:col-span-8 space-y-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4 print:border-zinc-200">
                            <BookOpen className="w-5 h-5 text-eduGreen-500" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Core Performance</h2>
                        </div>
                        <div className="space-y-4">
                            {grades.map((g: any, i: number) => (
                                <div key={i} className="flex items-center justify-between p-6 bg-zinc-900/30 rounded-3xl border border-zinc-900 print:bg-transparent print:border-zinc-200 group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center font-black text-eduGreen-500 print:bg-zinc-100">
                                            {g.subject?.name[0]}
                                        </div>
                                        <div>
                                            <p className="font-black text-white print:text-black">{g.subject?.name}</p>
                                            <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{g.exam?.title}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8 items-center">
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Raw Score</p>
                                            <p className="text-xl font-black text-white print:text-black">{g.score}%</p>
                                        </div>
                                        <div className="w-12 h-12 bg-eduGreen-950/20 border border-eduGreen-900/30 rounded-xl flex items-center justify-center font-black text-eduGreen-500 print:border-zinc-300">
                                            {g.score >= 90 ? 'A' : g.score >= 80 ? 'B' : g.score >= 70 ? 'C' : 'D'}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4 print:border-zinc-200">
                            <Award className="w-5 h-5 text-eduGreen-500" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Faculty Observations</h2>
                        </div>
                        <div className="space-y-6">
                            {remarks.length > 0 ? remarks.map((r: any, i: number) => (
                                <div key={i} className="space-y-3 p-8 bg-zinc-900/10 rounded-[2rem] border-l-4 border-eduGreen-600 print:bg-transparent print:border-zinc-200">
                                    <p className="text-zinc-400 print:text-zinc-700 italic leading-relaxed text-sm">"{r.content}"</p>
                                    <div className="flex items-center gap-2">
                                        <User className="w-3 h-3 text-zinc-700" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">— {r.teacher?.name}</span>
                                    </div>
                                </div>
                            )) : (
                                <p className="text-center py-12 text-zinc-800 font-black uppercase tracking-[0.3em] text-[10px]">No qualitative data recorded</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar Stats */}
                <div className="md:col-span-4 space-y-12">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 border-b border-zinc-900 pb-4 print:border-zinc-200">
                            <Calendar className="w-5 h-5 text-eduGreen-500" />
                            <h2 className="text-xl font-black uppercase tracking-widest">Vitals</h2>
                        </div>
                        <div className="grid gap-4">
                            <div className="p-6 bg-zinc-900/30 rounded-3xl border border-zinc-900 print:bg-transparent print:border-zinc-200 text-center">
                                <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-2">Session Attendance</p>
                                <p className="text-4xl font-black text-eduGreen-500">{Math.round((attendance.present / (attendance.total || 1)) * 100)}%</p>
                                <p className="text-[10px] text-zinc-600 font-bold uppercase mt-2 tracking-tighter">
                                    {attendance.present} Present • {attendance.absent} Absent
                                </p>
                            </div>
                            <div className="p-6 bg-zinc-900/30 rounded-3xl border border-zinc-900 print:bg-transparent print:border-zinc-200 text-center">
                                <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-2">Institutional Standing</p>
                                <p className="text-4xl font-black text-white print:text-black">EXCEL</p>
                                <div className="mt-4 h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-eduGreen-600 w-[85%]" />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-8 border border-zinc-900 border-dashed rounded-[2rem] print:border-zinc-300">
                        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-4">Official Verification</p>
                        <div className="space-y-8">
                            <div className="border-b border-zinc-900 pb-2 print:border-zinc-200">
                                <p className="text-[10px] font-black text-white print:text-black uppercase">Institutional Director</p>
                            </div>
                            <div className="border-b border-zinc-900 pb-2 print:border-zinc-200">
                                <p className="text-[10px] font-black text-white print:text-black uppercase">Registrar Authentication</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
