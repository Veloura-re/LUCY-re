"use client";

import { useEffect, useState } from "react";
import { format, differenceInMinutes, addMinutes, isWithinInterval } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { PlayCircle, Clock, Calendar, CheckCircle2, ChevronRight, BookOpen, BrainCircuit } from "lucide-react";
import { motion } from "framer-motion";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { cn } from "@/lib/utils";

// Mock Data (will replace with API calls)
const MOCK_LESSON = {
    subject: "Advanced Physics",
    topic: "Quantum Superposition & Entanglement",
    teacher: "Dr. Freeman",
    startTime: new Date(), // Now
    endTime: addMinutes(new Date(), 45), // 45 mins from now
    period: "Period 3"
};

const UPDATE_INTERVAL = 30000; // 30s

export default function StudentHubPage() {
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [progress, setProgress] = useState(0);
    const [currentLesson, setCurrentLesson] = useState<any>(null);
    const [stats, setStats] = useState<any>({ attendance: 0, nextExam: null });

    useEffect(() => {
        const fetchDashboard = async () => {
            try {
                const res = await fetch('/api/student/dashboard');
                if (res.ok) {
                    const data = await res.json();
                    setStats({ attendance: data.attendance || 100, nextExam: data.nextExam, name: data.studentName });
                    // Convert date strings back to objects if needed, but API returns strings usually
                    if (data.currentLesson) {
                        setCurrentLesson({
                            ...data.currentLesson,
                            startTime: new Date(data.currentLesson.startTime),
                            endTime: new Date(data.currentLesson.endTime)
                        });
                    } else {
                        setCurrentLesson(null);
                    }
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboard();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (currentLesson) {
            const totalDuration = differenceInMinutes(currentLesson.endTime, currentLesson.startTime);
            const elapsed = differenceInMinutes(currentTime, currentLesson.startTime);
            const percent = Math.min(100, Math.max(0, (elapsed / totalDuration) * 100));
            setProgress(percent);
        }
    }, [currentTime, currentLesson]);

    if (loading) {
        return (
            <div className="h-[60vh] flex items-center justify-center">
                <SpringingLoader message="Syncing Academic Uplink" />
            </div>
        );
    }

    const minutesRemaining = currentLesson ? differenceInMinutes(currentLesson.endTime, currentTime) : 0;

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div>
                <h1 className="text-4xl font-black text-white tracking-tighter">
                    {currentTime.getHours() < 12 ? "Good morning" : currentTime.getHours() < 18 ? "Good afternoon" : "Good evening"}, <span className="text-eduGreen-500">{stats.name || "Student"}</span>
                </h1>
                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs mt-2">
                    {format(currentTime, "EEEE, MMMM do • HH:mm a")}
                </p>
            </div>

            {/* Live Lesson Card (The "Learning Now" Feature) */}
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative overflow-hidden rounded-[2.5rem] group"
            >
                <div className="absolute inset-0 bg-gradient-to-br from-eduGreen-900/40 via-zinc-950 to-black border border-eduGreen-500/20" />

                {currentLesson ? (
                    <div className="relative p-8 md:p-10 text-white">
                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
                            <div className="flex gap-4">
                                <div className="p-4 bg-eduGreen-500 rounded-3xl shadow-[0_0_30px_rgba(20,184,115,0.4)] animate-pulse">
                                    <BrainCircuit className="w-8 h-8 text-black" />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="bg-eduGreen-500/20 text-eduGreen-400 border border-eduGreen-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 rounded-full bg-eduGreen-500 animate-ping" />
                                            Live Session
                                        </span>
                                        <span className="text-zinc-500 font-bold text-xs uppercase tracking-wider">• {currentLesson.period}</span>
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight">{currentLesson.subject}</h2>
                                    <p className="text-zinc-400 font-bold text-lg mt-1">{currentLesson.topic}</p>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-5xl font-black tracking-tighter tabular-nums text-eduGreen-500">
                                    {minutesRemaining}<span className="text-lg">m</span>
                                </div>
                                <p className="text-zinc-600 font-bold text-xs uppercase tracking-widest mt-1">Remaining</p>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                <span>{format(currentLesson.startTime, "HH:mm")}</span>
                                <span>{Math.round(progress)}% Complete</span>
                                <span>{format(currentLesson.endTime, "HH:mm")}</span>
                            </div>
                            <div className="h-4 bg-zinc-900 rounded-full overflow-hidden border border-zinc-800">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-eduGreen-600 to-eduGreen-400 shadow-[0_0_20px_rgba(20,184,115,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1, ease: "easeOut" }}
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <Button className="h-12 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest text-[10px] px-8 rounded-xl transition-all active:scale-95 shadow-xl">
                                Open Materials
                            </Button>
                            <Button variant="ghost" className="h-12 text-zinc-400 hover:text-white font-black uppercase tracking-widest text-[10px] px-8 rounded-xl border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800">
                                Message Teacher
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-10 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                            <Clock className="w-6 h-6 text-zinc-600" />
                        </div>
                        <h3 className="text-xl font-black text-white">No active class right now</h3>
                        <p className="text-zinc-500 font-bold text-sm max-w-xs">Take a break or review your upcoming schedule.</p>
                    </div>
                )}
            </motion.div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="bg-zinc-950/40 border-zinc-900 hover:border-eduGreen-500/30 transition-all group overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-zinc-900 rounded-xl group-hover:bg-eduGreen-900/20 transition-colors">
                            <BookOpen className="w-5 h-5 text-zinc-400 group-hover:text-eduGreen-400" />
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Upcoming Exam</p>
                            <h4 className="text-white font-bold text-lg">{stats.nextExam?.subject || "No Exams"}</h4>
                            <p className="text-eduGreen-500 text-xs font-bold mt-1">{stats.nextExam ? stats.nextExam.title : "Caught up!"}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950/40 border-zinc-900 hover:border-eduGreen-500/30 transition-all group overflow-hidden">
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-zinc-900 rounded-xl group-hover:bg-eduGreen-900/20 transition-colors">
                            <CheckCircle2 className="w-5 h-5 text-zinc-400 group-hover:text-eduGreen-400" />
                        </div>
                        <div>
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Attendance</p>
                            <h4 className="text-white font-bold text-lg">{stats.attendance ? stats.attendance.toFixed(1) : "100"}%</h4>
                            <p className="text-zinc-500 text-xs font-bold mt-1">Excellent Record</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-zinc-950/40 border-zinc-900 hover:border-eduGreen-500/30 transition-all group overflow-hidden cursor-pointer">
                    <CardContent className="p-6 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-zinc-900 rounded-xl group-hover:bg-eduGreen-900/20 transition-colors">
                                <Calendar className="w-5 h-5 text-zinc-400 group-hover:text-eduGreen-400" />
                            </div>
                            <div>
                                <h4 className="text-white font-bold text-lg">View Full Schedule</h4>
                            </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-colors" />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
