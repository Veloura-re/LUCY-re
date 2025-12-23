"use client";

import { useEffect, useState } from "react";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, Clock, MapPin, BrainCircuit, ChevronRight, ChevronLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { cn } from "@/lib/utils";

// Mock Data
const TIMETABLE_DATA = [
    {
        day: "Monday",
        periods: [
            { id: 1, subject: "Mathematics", teacher: "Mr. Anderson", startTime: "08:00", endTime: "09:00", room: "101", topic: "Calculus: Derivatives" },
            { id: 2, subject: "Physics", teacher: "Dr. Freeman", startTime: "09:15", endTime: "10:15", room: "LAB-2", topic: "Quantum Mechanics Intro" },
            { id: 3, subject: "Chemistry", teacher: "Mrs. White", startTime: "10:30", endTime: "11:30", room: "LAB-1", topic: "Organic Compounds" },
        ]
    },
    {
        day: "Tuesday",
        periods: [
            { id: 4, subject: "History", teacher: "Mr. Smith", startTime: "08:00", endTime: "09:00", room: "204", topic: "World War II: European Front" },
            { id: 5, subject: "English", teacher: "Ms. Green", startTime: "09:15", endTime: "10:15", room: "201", topic: "Shakespeare: Hamlet Analysis" },
            { id: 6, subject: "Physical Ed", teacher: "Coach Carter", startTime: "10:30", endTime: "11:30", room: "GYM", topic: "Cardiovascular Endurance" },
        ]
    }
    // ... expanded as needed
];

export default function StudentTimetablePage() {
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [viewMode, setViewMode] = useState<"day" | "week">("week");

    useEffect(() => {
        setTimeout(() => setLoading(false), 800);
    }, []);

    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 5 }).map((_, i) => addDays(weekStart, i));

    if (loading) return <SpringingLoader message="Syncing Temporal Coordinates" />;

    return (
        <div className="space-y-8 animate-in fade-in duration-700 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter">Temporal <span className="text-eduGreen-500">Matrix</span></h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs mt-2">Class Schedule & Learning Objectives</p>
                </div>

                <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-900">
                    <Button
                        variant={viewMode === "week" ? "secondary" : "ghost"}
                        onClick={() => setViewMode("week")}
                        className="text-xs font-black uppercase tracking-widest px-6"
                    >
                        Weekly
                    </Button>
                    <Button
                        variant={viewMode === "day" ? "secondary" : "ghost"}
                        onClick={() => setViewMode("day")}
                        className="text-xs font-black uppercase tracking-widest px-6"
                    >
                        Daily Format
                    </Button>
                </div>
            </div>

            {/* Week Navigation */}
            <div className="flex items-center justify-between bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900 backdrop-blur-sm">
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, -7))}>
                    <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-center">
                    <h3 className="text-lg font-black text-white px-8">
                        {format(weekStart, "MMMM d")} - {format(addDays(weekStart, 4), "MMMM d, yyyy")}
                    </h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 7))}>
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-6">
                {weekDays.map((date, idx) => {
                    const dayData = TIMETABLE_DATA.find(d => d.day === format(date, "EEEE"));
                    const isToday = isSameDay(date, new Date());

                    return (
                        <motion.div
                            key={idx}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                        >
                            <Card className={cn(
                                "overflow-hidden border-zinc-900 transition-all",
                                isToday ? "bg-zinc-950/60 border-eduGreen-500/30 ring-1 ring-eduGreen-500/20" : "bg-zinc-950/30 hover:bg-zinc-950/50"
                            )}>
                                <div className="flex flex-col md:flex-row">
                                    {/* Date Column */}
                                    <div className={cn(
                                        "w-full md:w-32 p-6 flex items-center md:flex-col md:justify-center gap-2 border-b md:border-b-0 md:border-r border-zinc-800/50",
                                        isToday ? "bg-eduGreen-950/10 text-eduGreen-500" : "bg-zinc-900/20 text-zinc-500"
                                    )}>
                                        <span className="text-2xl font-black uppercase tracking-tighter">{format(date, "EEE")}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest">{format(date, "MMM d")}</span>
                                    </div>

                                    {/* Periods */}
                                    <div className="flex-1 p-6">
                                        {dayData ? (
                                            <div className="grid gap-4">
                                                {dayData.periods.map((period) => (
                                                    <div key={period.id} className="group relative flex flex-col md:flex-row md:items-center gap-4 p-4 rounded-xl bg-zinc-900/20 hover:bg-zinc-900/40 border border-zinc-800/50 transition-all">
                                                        {/* Time */}
                                                        <div className="w-32 flex items-center gap-2 text-zinc-400 font-mono text-xs font-bold">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                                                            {period.startTime} - {period.endTime}
                                                        </div>

                                                        {/* Details */}
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-1">
                                                                <h4 className="text-white font-black text-lg tracking-tight group-hover:text-eduGreen-400 transition-colors">
                                                                    {period.subject}
                                                                </h4>
                                                                <Badge variant="outline" className="border-zinc-800 text-[9px] uppercase tracking-widest text-zinc-600">
                                                                    Room {period.room}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-2 text-zinc-500 text-xs font-bold uppercase tracking-wider">
                                                                <span>{period.teacher}</span>
                                                                {period.topic && (
                                                                    <>
                                                                        <span className="text-zinc-700">•</span>
                                                                        <span className="text-eduGreen-600 flex items-center gap-1">
                                                                            <BrainCircuit className="w-3 h-3" /> {period.topic}
                                                                        </span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-zinc-700 font-bold uppercase tracking-widest text-xs py-8 opacity-50">
                                                No Scheduled Operations
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </Card>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
