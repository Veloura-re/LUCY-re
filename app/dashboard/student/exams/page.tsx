"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { format, differenceInMinutes, isPast, isFuture } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Timer, FileText, CheckCircle2, AlertCircle, ArrowRight, Lock, Brain } from "lucide-react";
import { motion } from "framer-motion";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { cn } from "@/lib/utils";

export default function StudentExamsPage() {
    const [loading, setLoading] = useState(true);
    const [exams, setExams] = useState<any[]>([]);

    useEffect(() => {
        const fetchExams = async () => {
            try {
                const res = await fetch('/api/student/exams');
                const data = await res.json();
                if (data.exams) setExams(data.exams);
            } catch (e) {
                console.error("Failed to fetch exams:", e);
            } finally {
                setLoading(false);
            }
        };
        fetchExams();
    }, []);

    if (loading) return <SpringingLoader message="Retrieving Assessment Protocols" />;

    return (
        <div className="space-y-8 max-w-5xl mx-auto animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">Assessment <span className="text-eduGreen-500">Center</span></h1>
                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs mt-2">Active Exams & Performance History</p>
            </div>

            <div className="grid gap-6">
                {exams.map((exam) => (
                    <motion.div
                        key={exam.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="group"
                    >
                        <Card className={cn(
                            "border-zinc-900 overflow-hidden relative transition-all duration-300",
                            exam.status === "ACTIVE" ? "bg-eduGreen-950/10 border-eduGreen-500/30 hover:shadow-[0_0_30px_rgba(20,184,115,0.1)]" : "bg-zinc-950/40 hover:border-zinc-700"
                        )}>
                            {exam.status === "ACTIVE" && (
                                <div className="absolute top-0 right-0 p-4">
                                    <span className="flex items-center gap-2 text-eduGreen-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        <span className="w-2 h-2 rounded-full bg-eduGreen-500" />
                                        Live Now
                                    </span>
                                </div>
                            )}

                            <CardContent className="p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div className="flex items-start gap-6">
                                    <div className={cn(
                                        "w-16 h-16 rounded-2xl flex items-center justify-center border shadow-xl flex-shrink-0",
                                        exam.status === "ACTIVE" ? "bg-eduGreen-500 text-black border-eduGreen-400" :
                                            exam.status === "COMPLETED" ? "bg-zinc-900 text-zinc-500 border-zinc-800" :
                                                "bg-zinc-950 text-white border-zinc-800"
                                    )}>
                                        {exam.status === "ACTIVE" ? <Timer className="w-8 h-8 animate-spin-slow" /> :
                                            exam.status === "COMPLETED" ? <CheckCircle2 className="w-8 h-8" /> :
                                                <FileText className="w-8 h-8" />}
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <Badge variant="outline" className="border-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                                                {exam.subject}
                                            </Badge>
                                            <span className="text-zinc-600 font-bold text-[10px] uppercase tracking-widest">
                                                {format(exam.date, "MMM dd, yyyy • HH:mm a")}
                                            </span>
                                        </div>
                                        <h3 className="text-2xl font-black text-white tracking-tight">{exam.title}</h3>
                                        <div className="flex items-center gap-4 mt-2 text-xs font-bold text-zinc-500 uppercase tracking-wide">
                                            <span className="flex items-center gap-1.5"><Timer className="w-3.5 h-3.5" /> {exam.duration} Mins</span>
                                            {exam.score !== undefined && (
                                                <span className="text-eduGreen-500">Score: {exam.score}%</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    {exam.status === "ACTIVE" ? (
                                        <Link href={`/exam/${exam.id}`}>
                                            <Button className="h-14 bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase tracking-widest px-8 rounded-xl shadow-[0_0_20px_rgba(20,184,115,0.2)] transition-all hover:scale-105 active:scale-95">
                                                Enter Exam Room <ArrowRight className="w-4 h-4 ml-2" />
                                            </Button>
                                        </Link>
                                    ) : exam.status === "UPCOMING" ? (
                                        <Button disabled className="h-14 bg-zinc-900 text-zinc-500 font-black uppercase tracking-widest px-8 rounded-xl border border-zinc-800 opacity-50 cursor-not-allowed">
                                            <Lock className="w-4 h-4 mr-2" /> Locked
                                        </Button>
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <Link href="/dashboard/student/grades">
                                                <Button variant="outline" className="h-14 border-zinc-800 text-zinc-500 hover:text-white hover:bg-zinc-900 font-black uppercase tracking-widest px-8 rounded-xl">
                                                    View Table
                                                </Button>
                                            </Link>
                                            <Link href="/dashboard/student/grades">
                                                <Button size="icon" className="h-14 w-14 bg-eduGreen-900/20 border border-eduGreen-500/30 text-eduGreen-500 rounded-xl hover:bg-eduGreen-500 hover:text-black transition-all">
                                                    <Brain className="w-6 h-6" />
                                                </Button>
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
