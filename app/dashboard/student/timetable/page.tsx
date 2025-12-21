"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Book, User, CalendarDays, GraduationCap } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = [
    { label: "Monday", value: "MON" },
    { label: "Tuesday", value: "TUE" },
    { label: "Wednesday", value: "WED" },
    { label: "Thursday", value: "THU" },
    { label: "Friday", value: "FRI" }
];

export default function StudentTimetablePage() {
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1]?.value || "MON");

    useEffect(() => {
        fetchTimetable();
    }, []);

    const fetchTimetable = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/timetable');
            const data = await res.json();
            setTimetable(data.timetable || []);
        } catch (e) {
            console.error("Failed to fetch timetable", e);
        } finally {
            setLoading(false);
        }
    };

    const daySchedule = timetable.filter(entry => entry.dayOfWeek === selectedDay);

    if (loading) return <div className="p-20 text-center text-zinc-800 font-bold uppercase tracking-[0.3em] h-screen flex items-center justify-center animate-pulse">Retrieving Educational Roadmap...</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-10 py-10 animate-in fade-in slide-in-from-bottom-2 duration-1000">
            {/* Header */}
            <div className="text-center space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-eduGreen-500 text-[10px] font-black uppercase tracking-widest">
                    <GraduationCap className="w-3.5 h-3.5" /> Academic Routine
                </div>
                <h1 className="text-5xl font-black tracking-tighter text-dm-textMain uppercase italic">
                    The <span className="text-eduGreen-500 not-italic">Blueprint</span>
                </h1>
                <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px]">Cohort Synchronized Progression</p>
            </div>

            {/* Day Selector */}
            <div className="flex justify-center gap-2 overflow-x-auto pb-4 no-scrollbar">
                {DAYS.map(day => (
                    <button
                        key={day.value}
                        onClick={() => setSelectedDay(day.value)}
                        className={cn(
                            "min-w-28 px-6 py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1",
                            selectedDay === day.value
                                ? "bg-eduGreen-600 border-eduGreen-500 text-white shadow-xl shadow-eduGreen-900/30 -translate-y-1"
                                : "bg-zinc-950 border-zinc-900 text-zinc-700 hover:border-zinc-800 hover:text-zinc-400"
                        )}
                    >
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{day.label.slice(0, 3)}</span>
                        <span className="font-black text-xs uppercase tracking-tight">{day.label}</span>
                    </button>
                ))}
            </div>

            {/* Timeline */}
            <div className="space-y-6 relative">
                {/* Vertical Line */}
                <div className="absolute left-[2.25rem] top-0 bottom-0 w-0.5 bg-zinc-900 hidden md:block" />

                {daySchedule.length === 0 ? (
                    <div className="py-24 text-center text-zinc-800 font-black uppercase tracking-[0.4em] text-xs italic opacity-30">
                        Academic Recess
                    </div>
                ) : (
                    daySchedule.map((slot, i) => (
                        <div key={i} className="flex gap-8 group">
                            <div className="hidden md:flex flex-col items-center pt-2">
                                <div className="w-10 h-10 rounded-full bg-zinc-950 border-4 border-zinc-900 flex items-center justify-center font-black text-xs text-zinc-800 z-10 group-hover:bg-eduGreen-600 group-hover:border-eduGreen-500 group-hover:text-white transition-all">
                                    {i + 1}
                                </div>
                            </div>
                            <Card className="flex-1 bg-zinc-950/40 backdrop-blur-md border border-zinc-900/50 hover:border-eduGreen-900/30 transition-all rounded-3xl overflow-hidden group/card shadow-2xl">
                                <CardContent className="p-0 flex items-stretch">
                                    <div className="p-8 flex-1">
                                        <div className="flex items-center justify-between mb-4">
                                            <div className="px-3 py-1 rounded-lg bg-zinc-900 text-zinc-500 font-black text-[9px] uppercase tracking-widest border border-zinc-800">
                                                {slot.period?.name}
                                            </div>
                                            <div className="flex items-center gap-2 text-eduGreen-500 font-black text-sm tracking-tighter">
                                                <Clock className="w-4 h-4" />
                                                {slot.period?.startTime} - {slot.period?.endTime}
                                            </div>
                                        </div>
                                        <h3 className="text-3xl font-black text-dm-textMain tracking-tight leading-none mb-3">
                                            {slot.subject?.name}
                                        </h3>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-widest">
                                                <div className="w-6 h-6 rounded-lg bg-zinc-900 flex items-center justify-center group-hover/card:bg-eduGreen-950 transition-colors">
                                                    <User className="w-3.5 h-3.5 text-zinc-500" />
                                                </div>
                                                {slot.teacher?.name}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-2 bg-zinc-900 group-hover/card:bg-eduGreen-600 transition-colors" />
                                </CardContent>
                            </Card>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
