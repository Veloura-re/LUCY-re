"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Calendar, Users, CheckCircle2, XCircle, Clock, AlertCircle, Save, ChevronLeft, ChevronRight, MessageSquare, Shield } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { cn } from "@/lib/utils";
import { format, addDays, subDays } from "date-fns";
import Link from "next/link";
import { AlertModal } from "@/components/ui/confirmation-modal";

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

export default function HomeroomDashboard() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [myClass, setMyClass] = useState<any>(null);
    const [date, setDate] = useState(new Date());
    const [attendance, setAttendance] = useState<Record<string, { status: AttendanceStatus, reason?: string }>>({});
    const [stats, setStats] = useState({ present: 0, absent: 0, late: 0, excused: 0 });
    const [showAlert, setShowAlert] = useState(false);

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await fetchHomeroomInfo(user.id);
            }
        };
        init();
    }, []);

    useEffect(() => {
        if (myClass && date) {
            fetchAttendance();
        }
    }, [myClass, date]);

    const fetchHomeroomInfo = async (userId: string) => {
        try {
            const res = await fetch('/api/school/classes');
            const data = await res.json();

            // Find class where I am homeroom teacher
            let found = null;
            if (data.grades) {
                for (const grade of data.grades) {
                    const cls = grade.classes.find((c: any) => c.homeroomTeacher?.id === userId);
                    if (cls) {
                        found = { ...cls, gradeName: grade.name };
                        break;
                    }
                }
            }

            if (found) {
                // Fetch full students list for this class
                const sRes = await fetch(`/api/school/students?classId=${found.id}`);
                const sData = await sRes.json();
                found.students = sData.students || [];
                setMyClass(found);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const fetchAttendance = async () => {
        try {
            const formattedDate = format(date, 'yyyy-MM-dd');
            const res = await fetch(`/api/school/attendance?classId=${myClass.id}&date=${formattedDate}`);
            const data = await res.json();

            const records: Record<string, { status: AttendanceStatus, reason?: string }> = {};
            if (data.attendance) {
                data.attendance.forEach((rec: any) => {
                    records[rec.studentId] = { status: rec.status, reason: rec.reason };
                });
            }

            // For students with no record, default to PRESENT for display convenience
            myClass.students.forEach((s: any) => {
                if (!records[s.id]) {
                    records[s.id] = { status: 'PRESENT' };
                }
            });

            setAttendance(records);
            calculateStats(records);
        } catch (e) {
            console.error(e);
        }
    };

    const calculateStats = (records: Record<string, { status: AttendanceStatus }>) => {
        const counts = { present: 0, absent: 0, late: 0, excused: 0 };
        Object.values(records).forEach(r => {
            if (r.status === 'PRESENT') counts.present++;
            if (r.status === 'ABSENT') counts.absent++;
            if (r.status === 'LATE') counts.late++;
            if (r.status === 'EXCUSED') counts.excused++;
        });
        setStats(counts);
    };

    const updateStatus = (studentId: string, status: AttendanceStatus) => {
        const newAttendance = {
            ...attendance,
            [studentId]: { ...attendance[studentId], status }
        };
        setAttendance(newAttendance);
        calculateStats(newAttendance);
    };

    const saveAttendance = async () => {
        setSaving(true);
        try {
            const recordsToSave = Object.entries(attendance).map(([studentId, data]) => ({
                studentId,
                status: data.status,
                reason: data.reason
            }));

            const res = await fetch('/api/school/attendance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    classId: myClass.id,
                    date: format(date, 'yyyy-MM-dd'),
                    records: recordsToSave
                })
            });

            if (res.ok) {
                setShowAlert(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <SpringingLoader message="Establishing Secure Homeroom Uplink" />
            </div>
        );
    }

    if (!myClass) {
        return (
            <div className="max-w-4xl mx-auto py-20 text-center">
                <div className="w-20 h-20 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center mx-auto mb-6 opacity-40">
                    <Shield className="w-10 h-10 text-eduGreen-500" />
                </div>
                <h1 className="text-3xl font-black text-white mb-2 uppercase tracking-tighter">Access Restricted</h1>
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No Homeroom assignment detected for this identity.</p>
                <Link href="/dashboard">
                    <Button className="mt-8 bg-zinc-900 hover:bg-zinc-800 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 rounded-xl">Return to Core</Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-1000">
            {/* Hero Header */}
            <div className="relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-eduGreen-950/20 to-zinc-950 rounded-[3rem] border border-eduGreen-500/10 shadow-2xl" />
                <div className="relative p-12 flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950 border border-eduGreen-500/20 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest mb-4">
                            <CheckCircle2 className="w-3 h-3" /> Secure Homeroom Console
                        </div>
                        <h1 className="text-5xl font-black text-white tracking-tighter leading-none">
                            Class <span className="text-eduGreen-500 italic">{myClass.name}</span>
                        </h1>
                        <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs mt-4 opacity-80">
                            {myClass.gradeName} &bull; {myClass.students.length} Registered Learners
                        </p>
                    </div>

                    <div className="flex flex-col items-end gap-6">
                        <div className="flex bg-zinc-950 p-2 rounded-2xl border border-zinc-900 shadow-2xl items-center gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setDate(subDays(date, 1))} className="w-10 h-10 text-zinc-600 hover:text-white rounded-xl">
                                <ChevronLeft className="w-5 h-5" />
                            </Button>
                            <div className="px-4 py-2 flex items-center gap-3 border-x border-zinc-900">
                                <Calendar className="w-4 h-4 text-eduGreen-500" />
                                <span className="font-black text-zinc-100 text-[10px] uppercase tracking-widest">{format(date, 'MMMM dd, yyyy')}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setDate(addDays(date, 1))} className="w-10 h-10 text-zinc-600 hover:text-white rounded-xl">
                                <ChevronRight className="w-5 h-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Attendance Matrix */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Stats Sidebar */}
                <div className="space-y-4">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2rem] border-t-zinc-800/20 shadow-2xl overflow-hidden">
                        <CardHeader className="border-b border-zinc-900/50 p-6">
                            <CardTitle className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">
                                <Users className="w-4 h-4 text-eduGreen-500" /> Presence Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="space-y-4">
                                <StatRow label="Present" count={stats.present} color="text-eduGreen-500" bgColor="bg-eduGreen-500/10" icon={CheckCircle2} />
                                <StatRow label="Absent" count={stats.absent} color="text-red-500" bgColor="bg-red-500/10" icon={XCircle} />
                                <StatRow label="Late" count={stats.late} color="text-amber-500" bgColor="bg-amber-500/10" icon={Clock} />
                                <StatRow label="Excused" count={stats.excused} color="text-blue-500" bgColor="bg-blue-500/10" icon={AlertCircle} />
                            </div>

                            <Button
                                onClick={saveAttendance}
                                isLoading={saving}
                                className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all group"
                            >
                                <Save className="mr-2 w-4 h-4 group-hover:scale-110 transition-transform" /> Save Log
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Registry */}
                <div className="lg:col-span-3">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] border-t-zinc-800/20 shadow-2xl overflow-hidden">
                        <CardHeader className="p-8 border-b border-zinc-900/80">
                            <CardTitle className="text-xl font-black text-white tracking-tight leading-tight">Student Presence Matrix</CardTitle>
                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">Daily mark status for active learners</p>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-zinc-900/50">
                                {myClass.students.map((student: any) => (
                                    <div key={student.id} className="p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors group">
                                        <div className="flex items-center gap-5">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-900 flex items-center justify-center font-black text-zinc-600 group-hover:border-eduGreen-900/30 transition-colors shadow-xl overflow-hidden relative">
                                                {student.firstName[0]}
                                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50" />
                                            </div>
                                            <div>
                                                <p className="font-black text-zinc-100 group-hover:text-white transition-colors tracking-tight text-base mb-0.5">{student.firstName} {student.lastName}</p>
                                                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest font-mono">{student.studentCode}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <StatusButton
                                                active={attendance[student.id]?.status === 'PRESENT'}
                                                onClick={() => updateStatus(student.id, 'PRESENT')}
                                                color="text-eduGreen-500"
                                                icon={CheckCircle2}
                                                label="Present"
                                            />
                                            <StatusButton
                                                active={attendance[student.id]?.status === 'ABSENT'}
                                                onClick={() => updateStatus(student.id, 'ABSENT')}
                                                color="text-red-500"
                                                icon={XCircle}
                                                label="Absent"
                                            />
                                            <StatusButton
                                                active={attendance[student.id]?.status === 'LATE'}
                                                onClick={() => updateStatus(student.id, 'LATE')}
                                                color="text-amber-500"
                                                icon={Clock}
                                                label="Late"
                                            />
                                            <StatusButton
                                                active={attendance[student.id]?.status === 'EXCUSED'}
                                                onClick={() => updateStatus(student.id, 'EXCUSED')}
                                                color="text-blue-500"
                                                icon={AlertCircle}
                                                label="Excused"
                                            />

                                            <div className="w-px h-8 bg-zinc-900 mx-2" />

                                            <div className="flex items-center gap-2">
                                                {student.userId && (
                                                    <Link href={`/dashboard/messages?userId=${student.userId}`}>
                                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-zinc-500 hover:text-eduGreen-500 hover:bg-eduGreen-950/20 border-zinc-900 border transition-all">
                                                            <MessageSquare className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                                {student.parentLinks?.[0]?.parent && (
                                                    <Link href={`/dashboard/messages?userId=${student.parentLinks[0].parent.id}`}>
                                                        <Button variant="ghost" size="icon" className="w-10 h-10 rounded-xl text-zinc-500 hover:text-amber-500 hover:bg-amber-950/20 border-zinc-900 border transition-all">
                                                            <Shield className="w-4 h-4" />
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertModal
                isOpen={showAlert}
                onClose={() => setShowAlert(false)}
                title="Log Synchronized"
                message="Institutional presence records have been successfully encrypted and committed to the core database."
                variant="success"
            />
        </div>
    );
}

function StatRow({ label, count, color, bgColor, icon: Icon }: any) {
    return (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/30 border border-zinc-900 group">
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl transition-all", bgColor)}>
                    <Icon className={cn("w-4 h-4", color)} />
                </div>
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
            </div>
            <span className={cn("font-black tracking-tighter text-lg", color)}>{count}</span>
        </div>
    );
}

function StatusButton({ active, onClick, color, icon: Icon, label }: any) {
    return (
        <Button
            size="icon"
            onClick={onClick}
            variant="ghost"
            title={label}
            className={cn(
                "w-11 h-11 rounded-2xl transition-all border p-0",
                active
                    ? cn("bg-zinc-950 border-zinc-800 shadow-xl", color)
                    : "bg-transparent border-transparent text-zinc-800 hover:text-zinc-600 hover:border-zinc-900"
            )}
        >
            <Icon className={cn("w-5 h-5", active ? "scale-110" : "")} />
        </Button>
    );
}
