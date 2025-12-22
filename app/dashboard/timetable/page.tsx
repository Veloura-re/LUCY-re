"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import {
    Clock, Calendar, Users, BookOpen, Plus, Save,
    Trash2, AlertTriangle, CheckCircle2, MoreHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AlertModal } from "@/components/ui/confirmation-modal";

const DAYS = [
    { label: "Monday", value: "MON" },
    { label: "Tuesday", value: "TUE" },
    { label: "Wednesday", value: "WED" },
    { label: "Thursday", value: "THU" },
    { label: "Friday", value: "FRI" }
];

export default function TimetableManagementPage() {
    const [periods, setPeriods] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [subjects, setSubjects] = useState<any[]>([]);
    const [teachers, setTeachers] = useState<any[]>([]);
    const [assignments, setAssignments] = useState<any[]>([]); // Staffing assignments
    const [selectedClassId, setSelectedClassId] = useState("");
    const [timetableEntries, setTimetableEntries] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState("builder");
    const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, isOpen: boolean, variant?: "info" | "success" | "error" }>({ title: "", message: "", isOpen: false, variant: "info" });

    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (selectedClassId) {
            fetchTimetable(selectedClassId);
            fetchStaffing(selectedClassId);
        }
    }, [selectedClassId]);

    const fetchStaffing = async (classId: string) => {
        try {
            const res = await fetch(`/api/school/staffing?classId=${classId}`);
            const data = await res.json();
            setAssignments(data.assignments || []);
        } catch (e) {
            console.error("Failed to fetch staffing", e);
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            const [pRes, cRes, sRes, tRes] = await Promise.all([
                fetch(`/api/school/periods${selectedClassId ? `?classId=${selectedClassId}` : ''}`),
                fetch('/api/school/classes'),
                fetch('/api/school/subjects'),
                fetch('/api/school/teachers')
            ]);

            const [pData, cData, sData, tData] = await Promise.all([
                pRes.json(),
                cRes.json(),
                sRes.json(),
                tRes.json()
            ]);

            setPeriods(pData.periods || []);

            // Extract and flatten classes from grades if nested, otherwise use directly
            let flattenedClasses = [];
            if (cData.grades) {
                flattenedClasses = cData.grades.flatMap((g: any) => g.classes.map((c: any) => ({ ...c, gradeName: g.name })));
            } else {
                flattenedClasses = cData.classes || [];
            }
            setClasses(flattenedClasses);

            setSubjects(sData.subjects || []);
            setTeachers(tData.teachers || []);

            if (flattenedClasses.length > 0) {
                setSelectedClassId(flattenedClasses[0].id);
            }
        } catch (e) {
            console.error("Failed to load initial data", e);
        } finally {
            setLoading(false);
        }
    };

    const fetchTimetable = async (classId: string) => {
        try {
            const [tRes, pRes] = await Promise.all([
                fetch(`/api/school/timetable?classId=${classId}`),
                fetch(`/api/school/periods?classId=${classId}`)
            ]);
            const tData = await tRes.json();
            const pData = await pRes.json();

            setTimetableEntries(tData.timetable || []);
            // If the class has periods, use them. Otherwise fallback to global or keep existing?
            // User requested: "different periods for every class"
            if (pData.periods && pData.periods.length > 0) {
                setPeriods(pData.periods);
            }
        } catch (e) {
            console.error("Failed to load timetable/periods", e);
        }
    };

    const handleSavePeriods = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/school/periods', {
                method: 'POST',
                body: JSON.stringify({
                    periods,
                    classId: selectedClassId
                })
            });
            if (res.ok) {
                setAlertConfig({
                    title: "Structure Sealed",
                    message: "The institutional day sequence has been successfully synchronized and archived.",
                    isOpen: true,
                    variant: "success"
                });
            }
        } catch (e) {
            setAlertConfig({
                title: "Protocol Fault",
                message: "Failed to synchronize period data with core infrastructure.",
                isOpen: true,
                variant: "error"
            });
        } finally {
            setSaving(false);
        }
    };

    const addPeriod = () => {
        const nextOrder = periods.length + 1;
        setPeriods([...periods, {
            name: `Period ${nextOrder}`,
            startTime: "08:00",
            endTime: "08:45",
            isBreak: false,
            order: nextOrder
        }]);
    };

    const assignSlot = async (periodId: string, day: string, data: { subjectId: string, teacherId: string }) => {
        try {
            const res = await fetch('/api/school/timetable', {
                method: 'POST',
                body: JSON.stringify({
                    classId: selectedClassId,
                    periodId,
                    dayOfWeek: day,
                    subjectId: data.subjectId,
                    teacherId: data.teacherId
                })
            });
            const result = await res.json();
            if (res.ok) {
                fetchTimetable(selectedClassId);
            } else {
                setAlertConfig({
                    title: "Conflict Detected",
                    message: result.error || "A spatial-temporal overlap was detected in the faculty schedule.",
                    isOpen: true,
                    variant: "error"
                });
            }
        } catch (e) {
            setAlertConfig({
                title: "Network Fault",
                message: "Communication with the central timetable node was interrupted.",
                isOpen: true,
                variant: "error"
            });
        }
    };

    const removeSlot = async (entryId: string) => {
        try {
            const res = await fetch(`/api/school/timetable?id=${entryId}`, { method: 'DELETE' });
            if (res.ok) fetchTimetable(selectedClassId);
        } catch (e) {
            setAlertConfig({
                title: "Decommission Failed",
                message: "Unable to purge the selected timetable slot from active registry.",
                isOpen: true,
                variant: "error"
            });
        }
    };

    if (loading) return <div className="p-12 text-zinc-500 font-bold uppercase tracking-widest animate-pulse">Synchronizing Clockwork...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Academic <span className="text-eduGreen-500 italic">Clockwork</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Institutional Period & Day Structure Authority</p>
                </div>
            </div>

            <Tabs defaultValue="builder" className="space-y-8" onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-950/40 backdrop-blur-xl border border-zinc-900/50 p-1.5 rounded-2xl h-16">
                    <TabsTrigger value="builder" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Timetable Builder</TabsTrigger>
                    <TabsTrigger value="periods" className="rounded-xl px-8 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-eduGreen-600 data-[state=active]:text-white">Day Structure</TabsTrigger>
                </TabsList>

                {/* --- Timetable Builder --- */}
                <TabsContent value="builder" className="space-y-8 animate-in slide-in-from-bottom-4">
                    <Card className="p-8 bg-zinc-950/40 backdrop-blur-md border-zinc-900/50 rounded-[2.5rem] relative z-20">
                        <div className="flex flex-col md:flex-row items-end gap-6">
                            <div className="space-y-3 w-72">
                                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 ml-1">Class Cohort</label>
                                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                    <SelectTrigger className="h-14 bg-zinc-950/50 border-2 border-zinc-900 rounded-xl text-white font-bold">
                                        <SelectValue placeholder="Select Class" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-zinc-950 border-zinc-900 text-white">
                                        {classes.map((cls) => (
                                            <SelectItem key={cls.id} value={cls.id} className="text-zinc-400 focus:text-white focus:bg-eduGreen-900/20">
                                                {cls.name} ({cls.gradeName})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex-1" />
                            <div className="bg-eduGreen-950/10 border border-eduGreen-900/20 rounded-2xl p-4 flex items-center gap-3">
                                <AlertTriangle className="w-5 h-5 text-eduGreen-500" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-eduGreen-500/80">Real-time conflict detection active</span>
                            </div>
                        </div>
                    </Card>

                    {/* Weekly Grid */}
                    <div className="overflow-x-auto rounded-[2.5rem] border border-zinc-900 shadow-2xl">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-zinc-950/80 border-b border-zinc-900">
                                    <th className="p-6 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 w-48 border-r border-zinc-900">Period Slot</th>
                                    {DAYS.map(day => (
                                        <th key={day.value} className="p-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">{day.label}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-900">
                                {periods.map(period => (
                                    <tr key={period.id} className="group/row hover:bg-zinc-900/10 transition-colors">
                                        <td className="p-6 border-r border-zinc-900 bg-zinc-950/20">
                                            <div className="font-black text-white text-lg tracking-tight leading-none mb-1">{period.name}</div>
                                            <div className="flex items-center gap-1.5 text-zinc-700 font-bold text-[9px] uppercase tracking-tighter">
                                                <Clock className="w-3 h-3" /> {period.startTime} - {period.endTime}
                                            </div>
                                        </td>
                                        {DAYS.map(day => {
                                            const entry = timetableEntries.find(e => e.periodId === period.id && e.dayOfWeek === day.value);
                                            return (
                                                <td key={day.value} className="p-4 relative min-w-[200px]">
                                                    {entry ? (
                                                        <div className="bg-zinc-900/50 p-4 rounded-[1.25rem] border border-zinc-800 relative group overflow-hidden shadow-xl hover:border-eduGreen-900/30 transition-all">
                                                            <div className="font-black text-eduGreen-500 text-sm tracking-tight mb-1">{entry.subject?.name}</div>
                                                            <div className="text-[9px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                                                                <Users className="w-3 h-3" /> {entry.teacher?.name}
                                                            </div>
                                                            <button
                                                                onClick={() => removeSlot(entry.id)}
                                                                className="absolute top-2 right-2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-red-500/50 hover:text-red-500"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex justify-center">
                                                            <SlotAssigner
                                                                subjects={subjects}
                                                                teachers={teachers}
                                                                staffing={assignments}
                                                                onAssign={(data: { subjectId: string, teacherId: string }) => assignSlot(period.id, day.value, data)}
                                                            />
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </TabsContent>

                {/* --- Period Structure --- */}
                <TabsContent value="periods" className="animate-in slide-in-from-bottom-4">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                        <CardHeader className="p-10 border-b border-zinc-900/80 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black text-white tracking-tight leading-tight">Day Sequence</CardTitle>
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">Configure global teaching slots</p>
                            </div>
                            <div className="flex gap-4">
                                <Button onClick={addPeriod} variant="outline" className="border-zinc-900 bg-zinc-950/50 text-zinc-500 hover:text-white rounded-2xl h-12 px-6 font-black uppercase text-[10px] tracking-widest transition-all">
                                    <Plus className="w-4 h-4 mr-2" /> Add Slot
                                </Button>
                                <Button onClick={handleSavePeriods} isLoading={saving} className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-12 px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all shadow-eduGreen-900/20">
                                    <Save className="w-4 h-4 mr-2" /> Seal Structure
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <div className="space-y-4">
                                {periods.map((p, idx) => (
                                    <div key={idx} className="flex flex-col md:flex-row items-center gap-6 p-6 bg-zinc-950/40 border border-zinc-900/50 rounded-2xl group transition-all hover:bg-zinc-950">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-900 flex items-center justify-center text-zinc-600 font-black text-xs">#{idx + 1}</div>
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-700 ml-1">Title</label>
                                                <Input
                                                    value={p.name}
                                                    onChange={(e) => {
                                                        const newP = [...periods];
                                                        newP[idx].name = e.target.value;
                                                        setPeriods(newP);
                                                    }}
                                                    className="h-12 bg-zinc-900 border-0 rounded-xl text-white font-bold placeholder:text-zinc-800"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-700 ml-1">Commences</label>
                                                <Input
                                                    type="time"
                                                    value={p.startTime}
                                                    onChange={(e) => {
                                                        const newP = [...periods];
                                                        newP[idx].startTime = e.target.value;
                                                        setPeriods(newP);
                                                    }}
                                                    className="h-12 bg-zinc-900 border-0 rounded-xl text-white font-mono font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-700 ml-1">Concludes</label>
                                                <Input
                                                    type="time"
                                                    value={p.endTime}
                                                    onChange={(e) => {
                                                        const newP = [...periods];
                                                        newP[idx].endTime = e.target.value;
                                                        setPeriods(newP);
                                                    }}
                                                    className="h-12 bg-zinc-900 border-0 rounded-xl text-white font-mono font-bold"
                                                />
                                            </div>
                                            <div className="flex items-center gap-4 pt-6">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => setPeriods(periods.filter((_, i) => i !== idx))}
                                                    className="text-zinc-800 hover:text-red-500 hover:bg-red-950/20"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />
        </div>
    );
}

function SlotAssigner({ subjects, teachers, staffing, onAssign }: any) {
    const [subId, setSubId] = useState("");
    const [teacherId, setTeacherId] = useState("");
    const [open, setOpen] = useState(false);

    // Auto-select teacher when subject changes
    useEffect(() => {
        if (subId) {
            const assignment = staffing.find((a: any) => a.subjectId === subId);
            if (assignment) setTeacherId(assignment.teacherId);
        }
    }, [subId, staffing]);

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="w-10 h-10 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center text-zinc-800 hover:text-eduGreen-500 hover:border-eduGreen-900/30 transition-all active:scale-90"
            >
                <Plus className="w-4 h-4" />
            </button>
        );
    }

    return (
        <div className="bg-zinc-950 p-4 rounded-2xl border-2 border-eduGreen-900/30 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="space-y-3">
                <Select value={subId} onValueChange={setSubId}>
                    <SelectTrigger className="h-10 bg-zinc-900 border-0 rounded-lg text-white font-bold text-[10px] uppercase tracking-widest">
                        <SelectValue placeholder="Subject" />
                    </SelectTrigger>
                    <SelectContent>
                        {subjects.map((s: any) => (
                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select value={teacherId} onValueChange={setTeacherId}>
                    <SelectTrigger className="h-10 bg-zinc-900 border-0 rounded-lg text-white font-bold text-[10px] uppercase tracking-widest">
                        <SelectValue placeholder="Teacher" />
                    </SelectTrigger>
                    <SelectContent>
                        {teachers.map((t: any) => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="flex gap-2">
                    <Button
                        size="sm"
                        onClick={() => {
                            onAssign({ subjectId: subId, teacherId });
                            setOpen(false);
                        }}
                        className="flex-1 bg-eduGreen-600 text-white text-[9px] font-black uppercase tracking-widest rounded-lg h-9"
                    >
                        Save
                    </Button>
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        className="text-[9px] font-black uppercase tracking-widest text-zinc-500 h-9"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
}
