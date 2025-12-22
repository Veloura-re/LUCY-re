"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users,
    Calendar,
    AlertTriangle,
    TrendingUp,
    MessageSquare,
    Shield,
    FileText,
    CheckCircle2,
    Search,
    ChevronRight,
    ArrowUpRight,
    Clock,
    ClipboardCheck
} from "lucide-react";
import Link from "next/link";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function HomeroomDashboard() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStudent, setSelectedStudent] = useState<any>(null);

    useEffect(() => {
        fetchHomeroomData();
    }, []);

    const fetchHomeroomData = async () => {
        try {
            const res = await fetch('/api/homeroom/data');
            const json = await res.json();
            if (json.homeroom) setData(json.homeroom);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <SpringingLoader message="Initializing Homeroom Command Center" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-zinc-900 rounded-[2rem] flex items-center justify-center mb-6 border border-zinc-800 opacity-20">
                    <Shield className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight uppercase">Access Denied</h2>
                <p className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] mt-2">No Homeroom assignment detected in institutional records</p>
                <Link href="/dashboard" className="mt-8">
                    <Button variant="outline" className="rounded-2xl border-zinc-900 bg-zinc-950/50 hover:border-zinc-700 font-black text-[10px] uppercase tracking-widest px-8 h-14">Return to Overview</Button>
                </Link>
            </div>
        );
    }

    const students = data.students || [];
    const filteredStudents = students.filter((s: any) =>
        `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Calc some stats for the "Overview"
    const totalStudents = students.length;
    const lowAttendance = students.filter((s: any) => (s.attendanceRecords?.length || 0) < 3).length; // Placeholder logic
    const topPerformers = students.filter((s: any) => {
        const avg = s.gradeRecords?.length
            ? s.gradeRecords.reduce((acc: number, r: any) => acc + Number(r.score), 0) / s.gradeRecords.length
            : 0;
        return avg > 80;
    }).length;

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest mb-4">
                        <Shield className="w-3 h-3 text-eduGreen-500" />
                        <span>Lead Authority</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight leading-none italic">
                        Class {data.name} <span className="text-zinc-700 not-italic block md:inline md:ml-3">Dashboard</span>
                    </h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm leading-relaxed max-w-2xl">
                        Integrated academic oversight for Grade {data.grade?.level}. Monitor behavioral cycles, performance benchmarks, and institutional records in real-time.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 transition-all active:scale-95">
                        <ClipboardCheck className="mr-2 h-4 w-4" />
                        Log Attendance
                    </Button>
                </div>
            </div>

            {/* Quick Stats Banner */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { label: "Active Cohort", value: totalStudents, sub: "Learners Enrolled", icon: Users, color: "text-eduGreen-400" },
                    { label: "Critical Alerts", value: lowAttendance, sub: "Attendance Flagged", icon: AlertTriangle, color: "text-amber-500" },
                    { label: "High Performers", value: topPerformers, sub: "Exceeding Benchmarks", icon: TrendingUp, color: "text-eduGreen-500" },
                    { label: "Daily Presence", value: "94%", sub: "Cohort Avg Today", icon: CheckCircle2, color: "text-eduGreen-500" }
                ].map((stat, i) => (
                    <Card key={i} className="bg-zinc-950/40 backdrop-blur-md border-zinc-900/50 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
                            <stat.icon className="w-12 h-12" />
                        </div>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">{stat.label}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-white tracking-tighter mb-1">{stat.value}</div>
                            <p className="text-[10px] text-zinc-800 font-bold uppercase tracking-widest">{stat.sub}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Interactive Grid */}
            <div className="grid lg:grid-cols-12 gap-10">
                {/* Student Registry (Left 8 cols) */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="bg-zinc-900/30 backdrop-blur-md border-zinc-900/80 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 border-b border-zinc-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <CardTitle className="text-xl font-black text-white tracking-tight">Digital Registry</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Cohort Managed Profiles</CardDescription>
                            </div>
                            <div className="relative max-w-xs w-full">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700" />
                                <input
                                    placeholder="Search registry..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-12 w-full appearance-none bg-zinc-950/50 border-zinc-900 text-white placeholder:text-zinc-800 focus:border-eduGreen-900/50 h-12 rounded-xl transition-all border-2 font-bold text-sm tracking-tight outline-none"
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-950">
                                {filteredStudents.length === 0 ? (
                                    <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
                                        <Users className="w-10 h-10" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">No matching records</p>
                                    </div>
                                ) : (
                                    filteredStudents.map((student: any, idx: number) => {
                                        const avgScore = student.gradeRecords?.length
                                            ? Math.round(student.gradeRecords.reduce((acc: number, r: any) => acc + Number(r.score), 0) / student.gradeRecords.length)
                                            : 0;

                                        const lastAtt = student.attendanceRecords?.[0];

                                        return (
                                            <div key={idx} className="p-6 flex items-center justify-between hover:bg-eduGreen-900/5 transition-all group/row">
                                                <div className="flex items-center gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center font-black text-zinc-600 uppercase group-hover/row:border-eduGreen-900/30 transition-colors shadow-2xl text-lg relative overflow-hidden shrink-0">
                                                        {student.firstName[0]}
                                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-eduGreen-500/20" />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-3">
                                                            <p className="font-black text-zinc-100 group-hover/row:text-white transition-colors tracking-tight text-lg leading-none">
                                                                {student.firstName} {student.lastName}
                                                            </p>
                                                            <div className={cn(
                                                                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border",
                                                                avgScore >= 80 ? "bg-eduGreen-950/20 border-eduGreen-900/50 text-eduGreen-500" :
                                                                    avgScore >= 50 ? "bg-amber-950/20 border-amber-900/50 text-amber-500" :
                                                                        "bg-red-950/20 border-red-900/50 text-red-500"
                                                            )}>
                                                                {avgScore}% AVG
                                                            </div>
                                                            {lastAtt?.status === 'ABSENT' && (
                                                                <div className="px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border bg-red-950/40 border-red-500/30 text-red-500 animate-pulse">
                                                                    Absent
                                                                </div>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <div className="flex items-center gap-1.5">
                                                                <MessageSquare className="w-3 h-3 text-zinc-800" />
                                                                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">{student.parentLinks?.length || 0} Guardians Linked</span>
                                                            </div>
                                                            <div className="w-1 h-1 rounded-full bg-zinc-900" />
                                                            <div className="flex items-center gap-1.5">
                                                                <Clock className="w-3 h-3 text-zinc-800" />
                                                                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">
                                                                    Attendance: {lastAtt ? (lastAtt.status === 'PRESENT' ? 'Logged Present' : 'Absence Flagged') : 'No Record'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <Link href={`/dashboard/messages?userId=${student.userId}`}>
                                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-zinc-700 hover:text-eduGreen-500 hover:bg-eduGreen-950/20 transition-all border border-transparent hover:border-eduGreen-900/30">
                                                            <MessageSquare className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => setSelectedStudent(student)}
                                                        className="w-10 h-10 rounded-xl text-zinc-700 hover:text-white hover:bg-zinc-950 transition-all border border-transparent hover:border-zinc-800"
                                                    >
                                                        <ChevronRight className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Intelligence (Right 4 cols) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Behavioral Feed */}
                    <Card className="bg-zinc-950/50 backdrop-blur-2xl border-zinc-900/80 rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                <TrendingUp className="w-5 h-5 text-eduGreen-500" />
                                Intelligence Feed
                            </CardTitle>
                            <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Live Institutional Stream</CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-4 space-y-6">
                            {[
                                { type: "ALERT", label: "Attendance Spike", detail: `${lowAttendance} students flagged for absence today`, time: "Live" },
                                { type: "POSITIVE", label: "Registry Sync", detail: "All parental links verified for Term 1", time: "12m ago" },
                                { type: "INFO", label: "Exam Progress", detail: "Mathematics gradebook finalized by Lead Teacher", time: "1h ago" }
                            ].map((feed, i) => (
                                <div key={i} className="relative pl-6 border-l-2 border-zinc-900 group">
                                    <div className={cn(
                                        "absolute -left-1.5 top-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-950 transition-colors",
                                        feed.type === "POSITIVE" ? "bg-eduGreen-500" :
                                            feed.type === "ALERT" ? "bg-red-500" : "bg-zinc-700"
                                    )} />
                                    <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-100">{feed.label}</p>
                                            <span className="text-[8px] font-bold text-zinc-800 uppercase tracking-tighter">{feed.time}</span>
                                        </div>
                                        <p className="text-[11px] font-bold text-zinc-600 leading-tight">{feed.detail}</p>
                                    </div>
                                </div>
                            ))}

                            <Button className="w-full bg-zinc-900/50 hover:bg-zinc-900 text-zinc-600 hover:text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all mt-4 border border-zinc-900 border-t-zinc-800/30 shadow-lg">
                                View Full Event logs
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Quick Remarks Card */}
                    <Card className="bg-eduGreen-950/10 border-eduGreen-900/30 rounded-[2.5rem] relative overflow-hidden group">
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-eduGreen-500/5 blur-2xl group-hover:bg-eduGreen-500/10 transition-all" />
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-black text-white tracking-tight flex items-center gap-3">
                                <FileText className="w-5 h-5 text-eduGreen-500" />
                                Term Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-4">
                            <p className="text-xs font-bold text-zinc-500 leading-relaxed italic">
                                "Synthesize academic reports, behavioral insights, and institutional progress for the current operational term."
                            </p>
                            <Button className="w-full h-14 bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl shadow-eduGreen-900/20">
                                Initiate Term Record
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Student Detail Overlay */}
            {selectedStudent && (
                <StudentProfileModal
                    student={selectedStudent}
                    onClose={() => setSelectedStudent(null)}
                    onUpdate={fetchHomeroomData}
                />
            )}
        </div>
    );
}

function StudentProfileModal({ student, onClose, onUpdate }: { student: any, onClose: () => void, onUpdate: () => void }) {
    const [activeTab, setActiveTab] = useState<'REMARKS' | 'NOTES'>('REMARKS');
    const [content, setContent] = useState("");
    const [term, setTerm] = useState("Term 1 2024");
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!content) return;
        setSubmitting(true);
        try {
            const endpoint = activeTab === 'REMARKS' ? 'remarks' : 'notes';
            const body = activeTab === 'REMARKS' ? { content, term } : { content };

            const res = await fetch(`/api/school/students/${student.id}/${endpoint}`, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setContent("");
                onUpdate();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-500" onClick={onClose} />

            <Card className="w-full max-w-5xl bg-zinc-950 border-zinc-900 shadow-2xl rounded-[3rem] overflow-hidden relative z-10 animate-in zoom-in-95 duration-500 border-t-zinc-800/30">
                <div className="grid md:grid-cols-12 h-[80vh]">
                    {/* Record Sidebar */}
                    <div className="md:col-span-4 bg-zinc-900/30 border-r border-zinc-900 p-10 flex flex-col">
                        <div className="w-24 h-24 rounded-[2rem] bg-zinc-950 border border-zinc-900 flex items-center justify-center text-4xl font-black text-zinc-700 shadow-2xl mb-8">
                            {student.firstName[0]}
                        </div>
                        <h2 className="text-3xl font-black text-white tracking-tight">{student.firstName}</h2>
                        <h3 className="text-3xl font-black text-zinc-800 tracking-tight leading-none mb-4">{student.lastName}</h3>

                        <div className="space-y-6 mt-8">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-2">Student ID</p>
                                <p className="font-mono text-xs text-zinc-500 bg-zinc-950 p-2 rounded-lg border border-zinc-900 truncate">{student.id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-700 mb-2">Registry Status</p>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[9px] font-black text-eduGreen-500 uppercase tracking-widest">
                                    <CheckCircle2 className="w-3 h-3" />
                                    <span>Active Enrollment</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-auto">
                            <Button
                                onClick={onClose}
                                variant="outline"
                                className="w-full h-14 rounded-2xl border-zinc-900 bg-zinc-950/50 hover:bg-zinc-900 text-zinc-600 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all"
                            >
                                Close Record
                            </Button>
                        </div>
                    </div>

                    {/* Active Intelligence Feed */}
                    <div className="md:col-span-8 p-10 overflow-y-auto custom-scrollbar flex flex-col">
                        <div className="flex items-center gap-10 border-b border-zinc-900 pb-8 mb-10 overflow-x-auto">
                            <button
                                onClick={() => setActiveTab('REMARKS')}
                                className={cn(
                                    "text-lg font-black tracking-tight transition-all relative whitespace-nowrap",
                                    activeTab === 'REMARKS' ? "text-white" : "text-zinc-700 hover:text-zinc-500"
                                )}
                            >
                                Academic Remarks
                                {activeTab === 'REMARKS' && <div className="absolute -bottom-8 left-0 right-0 h-1 bg-eduGreen-500" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('NOTES')}
                                className={cn(
                                    "text-lg font-black tracking-tight transition-all relative whitespace-nowrap",
                                    activeTab === 'NOTES' ? "text-white" : "text-zinc-700 hover:text-zinc-500"
                                )}
                            >
                                Internal Notes
                                {activeTab === 'NOTES' && <div className="absolute -bottom-8 left-0 right-0 h-1 bg-eduGreen-500" />}
                            </button>
                        </div>

                        <div className="flex-1 space-y-8">
                            {/* Input Form */}
                            <div className="bg-zinc-900/40 p-8 rounded-3xl border border-zinc-900 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">New Entry Input</h4>
                                    {activeTab === 'REMARKS' && (
                                        <div className="w-40">
                                            <Select value={term} onValueChange={setTerm}>
                                                <SelectTrigger className="h-10 rounded-xl bg-zinc-950 border-zinc-900 text-[10px] uppercase tracking-widest text-zinc-500">
                                                    <SelectValue placeholder="Select Term" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-900">
                                                    <SelectItem value="Term 1 2024">Term 1 2024</SelectItem>
                                                    <SelectItem value="Term 2 2024">Term 2 2024</SelectItem>
                                                    <SelectItem value="Final 2024">Final 2024</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}
                                </div>
                                <textarea
                                    placeholder={activeTab === 'REMARKS' ? "Draft pedagogical summary..." : "Log internal observation..."}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full bg-zinc-950 border-2 border-zinc-900 rounded-2xl p-6 text-sm text-white placeholder:text-zinc-800 outline-none focus:border-zinc-700 transition-all min-h-[120px] font-bold"
                                />
                                <div className="flex justify-end">
                                    <Button
                                        onClick={handleSubmit}
                                        isLoading={submitting}
                                        disabled={!content}
                                        className={cn(
                                            "h-12 px-8 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all",
                                            "bg-eduGreen-600 hover:bg-eduGreen-500 text-white shadow-eduGreen-900/20"
                                        )}
                                    >
                                        Seal Entry
                                    </Button>
                                </div>
                            </div>

                            {/* History Placeholder */}
                            <div className="space-y-6">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-800">Historical Archives</h4>
                                <div className="p-10 border-2 border-dashed border-zinc-900 rounded-3xl flex flex-col items-center justify-center opacity-20">
                                    <Clock className="w-10 h-10 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">No archival data found</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
