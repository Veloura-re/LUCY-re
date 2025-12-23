"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Clock, Calendar, Users, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const DAYS = [
    { label: "Monday", value: "MON" },
    { label: "Tuesday", value: "TUE" },
    { label: "Wednesday", value: "WED" },
    { label: "Thursday", value: "THU" },
    { label: "Friday", value: "FRI" }
];

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { toast } from "sonner";

export default function TeacherSchedulePage() {
    const [timetable, setTimetable] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState(DAYS[new Date().getDay() - 1]?.value || "MON");

    const [syncModalOpen, setSyncModalOpen] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);
    const [lessonData, setLessonData] = useState({ topic: "", objectives: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchSchedule();
    }, []);

    const fetchSchedule = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/user/timetable');
            const data = await res.json();
            setTimetable(data.timetable || []);
        } catch (e) {
            console.error("Failed to fetch schedule", e);
        } finally {
            setLoading(false);
        }
    };

    const openSyncModal = (slot: any) => {
        // Calculate date based on Selected Day (Current week)
        const today = new Date();
        const currentDay = today.getDay(); // 0-6
        const daysMap: any = { "MON": 1, "TUE": 2, "WED": 3, "THU": 4, "FRI": 5 };
        const targetDay = daysMap[slot.dayOfWeek];
        // Simple logic for current week. 
        // If today is Monday(1) and target is Tuesday(2), add 1 day.
        // We'll approximate date for the prototype. In real app, date picker would be better or explicit week selector.
        // Let's assume current week.
        const diff = targetDay - (currentDay === 0 ? 7 : currentDay);
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() + diff);

        setSelectedSlot({ ...slot, targetDate });
        // Optionally fetch existing lesson here if we supported GET
        setLessonData({ topic: "", objectives: "" });
        setSyncModalOpen(true);
    };

    const handleLessonSync = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/teacher/lessons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId: selectedSlot.classId,
                    subjectId: selectedSlot.subjectId,
                    periodId: selectedSlot.periodId,
                    date: selectedSlot.targetDate.toISOString(),
                    topic: lessonData.topic,
                    objectives: lessonData.objectives
                })
            });

            if (res.ok) {
                toast.success("Lesson Synced Successfully");
                setSyncModalOpen(false);
            } else {
                toast.error("Sync Failed");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsSubmitting(false);
        }
    };

    const daySchedule = timetable.filter(entry => entry.dayOfWeek === selectedDay);

    if (loading) return <div className="p-20 text-center text-zinc-600 font-bold uppercase tracking-[0.3em] animate-pulse">Consulting Authority...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Teaching <span className="text-eduGreen-500 italic">Duty</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Personal Institutional Registry</p>
                </div>
                <div className="flex bg-zinc-950 p-1.5 rounded-2xl border border-zinc-900 shadow-2xl">
                    {DAYS.map(day => (
                        <button
                            key={day.value}
                            onClick={() => setSelectedDay(day.value)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                                selectedDay === day.value
                                    ? "bg-eduGreen-600 text-white shadow-lg shadow-eduGreen-900/20"
                                    : "text-zinc-600 hover:text-white"
                            )}
                        >
                            {day.label.slice(0, 3)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Daily View */}
            <div className="grid grid-cols-1 gap-8">
                {daySchedule.length === 0 ? (
                    <div className="p-32 rounded-[3rem] border-4 border-dashed border-zinc-900 flex flex-col items-center justify-center text-zinc-800 gap-4">
                        <Calendar className="w-12 h-12 opacity-20" />
                        <p className="font-black uppercase tracking-[0.3em] text-sm italic">No Scheduled Engagements</p>
                    </div>
                ) : (
                    daySchedule.map((slot, i) => (
                        <Card key={i} className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 hover:border-eduGreen-900/30 transition-all rounded-[2.5rem] overflow-hidden group shadow-2xl">
                            <CardContent className="p-0 flex flex-col md:flex-row items-stretch">
                                <div className="p-8 bg-zinc-900/20 md:w-64 border-b md:border-b-0 md:border-r border-zinc-900 flex flex-col justify-center">
                                    <div className="flex items-center gap-3 text-eduGreen-500 mb-3">
                                        <Clock className="w-5 h-5" />
                                        <span className="font-black text-lg tracking-tighter">{slot.period?.startTime} - {slot.period?.endTime}</span>
                                    </div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
                                        {slot.period?.name}
                                    </div>
                                </div>
                                <div className="p-8 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div>
                                        <h3 className="text-3xl font-black text-white tracking-tight mb-2 group-hover:text-eduGreen-500 transition-colors">
                                            {slot.subject?.name}
                                        </h3>
                                        <div className="flex items-center gap-4 text-zinc-500 font-bold text-xs uppercase tracking-widest">
                                            <div className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-zinc-800" />
                                                Cohort {slot.class?.name}
                                            </div>
                                            <div className="w-1 h-1 rounded-full bg-zinc-900" />
                                            <span>Institutional Primary Instructor</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => openSyncModal(slot)}
                                            className="h-12 px-6 rounded-xl bg-zinc-900 border border-zinc-800 text-white font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all hover:border-eduGreen-500/50 hover:text-eduGreen-500"
                                        >
                                            Access Lesson Sync
                                        </button>
                                        <button className="h-10 text-eduGreen-500 font-black text-[9px] uppercase tracking-widest hover:underline text-right">
                                            Mark Presence →
                                        </button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Sidebar Stats? */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <Card className="bg-zinc-950/20 border-zinc-900 rounded-2xl p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-2">Weekly Load</p>
                    <p className="text-3xl font-black text-white">{timetable.length} <span className="text-sm text-zinc-800 uppercase">Periods</span></p>
                </Card>
                <Card className="bg-zinc-950/20 border-zinc-900 rounded-2xl p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-2">Subject Reach</p>
                    <p className="text-3xl font-black text-white">{new Set(timetable.map(t => t.subjectId)).size} <span className="text-sm text-zinc-800 uppercase">Focus Areas</span></p>
                </Card>
                <Card className="bg-zinc-950/20 border-zinc-900 rounded-2xl p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-2">Active Cohorts</p>
                    <p className="text-3xl font-black text-white">{new Set(timetable.map(t => t.classId)).size} <span className="text-sm text-zinc-800 uppercase">Groups</span></p>
                </Card>
            </div>

            {/* Sync Modal */}
            <Dialog open={syncModalOpen} onOpenChange={setSyncModalOpen}>
                <DialogContent className="max-w-lg bg-zinc-950/95 backdrop-blur-3xl border-zinc-900 rounded-[2rem] p-0 overflow-hidden">
                    <DialogHeader className="p-8 border-b border-zinc-900">
                        <DialogTitle className="text-2xl font-black text-white tracking-tighter uppercase">
                            Lesson <span className="text-eduGreen-500">Sync</span>
                        </DialogTitle>
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
                            {selectedSlot && `${selectedSlot.subject?.name} • ${format(selectedSlot.targetDate, 'MMM d')}`}
                        </p>
                    </DialogHeader>
                    <form onSubmit={handleLessonSync} className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Topic of Study</Label>
                            <Input
                                value={lessonData.topic}
                                onChange={e => setLessonData({ ...lessonData, topic: e.target.value })}
                                required
                                placeholder="e.g. Introduction to Quantum Physics"
                                className="bg-zinc-900/50 border-zinc-800 rounded-xl font-bold"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Learning Objectives</Label>
                            <Textarea
                                value={lessonData.objectives}
                                onChange={e => setLessonData({ ...lessonData, objectives: e.target.value })}
                                placeholder="• Understand wave-particle duality..."
                                rows={4}
                                className="bg-zinc-900/50 border-zinc-800 rounded-xl font-medium resize-none"
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase tracking-widest h-12 rounded-xl">
                            {isSubmitting ? "Syncing..." : "Sync to Student Hub"}
                        </Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div >
    );
}
