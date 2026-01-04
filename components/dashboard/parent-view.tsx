"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { GraduationCap, Sparkles, Plus, Loader2, CheckCircle2, User, School, AlertCircle, MessageSquare, ArrowLeft, Shield, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { UpcomingEventsWidget } from "./upcoming-events";

interface VerifiedStudent {
    id: string;
    firstName: string;
    lastName: string;
    schoolName: string;
    gradeLevel: number;
}

export function ParentView({ user, childrenData: initialChildren }: { user: any, childrenData?: any[] }) {
    const [students, setStudents] = useState<any[]>(initialChildren || []);
    const [loadingStudents, setLoadingStudents] = useState(!initialChildren);
    const [isAdding, setIsAdding] = useState(false);
    const [code, setCode] = useState("");
    const [status, setStatus] = useState<'IDLE' | 'VERIFYING' | 'CONFIRMING' | 'LINKING' | 'SUCCESS'>('IDLE');
    const [error, setError] = useState<string | null>(null);
    const [foundStudent, setFoundStudent] = useState<VerifiedStudent | null>(null);
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [staffSearchQuery, setStaffSearchQuery] = useState("");
    const [staffResults, setStaffResults] = useState<any[]>([]);
    const [searchingStaff, setSearchingStaff] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (!initialChildren) {
            fetchStudents();
        } else if (initialChildren.length === 0) {
            setIsAdding(true);
        }
    }, [initialChildren]);

    const fetchStudents = async () => {
        setLoadingStudents(true);
        try {
            const res = await fetch('/api/parent/children');
            const data = await res.json();
            if (data.students) {
                setStudents(data.students);
                if (data.students.length === 0) setIsAdding(true);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingStudents(false);
        }
    };

    const verifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        setStatus('VERIFYING');
        setError(null);
        try {
            const res = await fetch('/api/parent/link-student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentCode: code, confirm: false })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to verify code");
            setFoundStudent(data.student);
            setStatus('CONFIRMING');
        } catch (err: any) {
            setError(err.message);
            setStatus('IDLE');
        }
    };

    const confirmLink = async () => {
        if (!foundStudent) return;
        setStatus('LINKING');
        try {
            const res = await fetch('/api/parent/link-student', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentCode: code, confirm: true })
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || "Failed to link");
            }
            setStatus('SUCCESS');
            setTimeout(() => {
                router.refresh();
                setIsAdding(false);
                setCode("");
                setStatus('IDLE');
                setFoundStudent(null);
            }, 2000);
        } catch (err: any) {
            setError(err.message);
            setStatus('CONFIRMING');
        }
    };

    const searchStaff = async (q: string) => {
        setStaffSearchQuery(q);
        if (q.length < 2) {
            setStaffResults([]);
            return;
        }
        setSearchingStaff(true);
        try {
            const res = await fetch(`/api/parent/staff?q=${encodeURIComponent(q)}`);
            const data = await res.json();
            if (data.staff) setStaffResults(data.staff);
        } catch (e) {
            console.error(e);
        } finally {
            setSearchingStaff(false);
        }
    };

    const startStaffChat = async (staffId: string) => {
        try {
            const res = await fetch('/api/messages/rooms', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetUserId: staffId })
            });
            const data = await res.json();
            if (data.room) {
                router.push(`/dashboard/messages?roomId=${data.room.id}`);
            }
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Family <span className="text-eduGreen-500 italic">Portal</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Guardian Link & Scholastic Monitoring Nexus</p>
                </div>

                {students.length > 0 && !isAdding && (
                    <div className="flex items-center gap-3 mb-1">
                        <Dialog open={isContactModalOpen} onOpenChange={setIsContactModalOpen}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="border-zinc-800 text-zinc-500 hover:text-white h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all bg-transparent"
                                >
                                    <MessageSquare className="mr-2 h-4 w-4 text-eduGreen-500" /> Contact Staff
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-zinc-950 border-zinc-900 rounded-[2.5rem] p-0 overflow-hidden max-w-lg shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-eduGreen-500/50 to-transparent" />
                                <DialogHeader className="p-8 pb-4">
                                    <DialogTitle className="text-2xl font-black text-white uppercase tracking-tight italic">Staff <span className="text-eduGreen-500">Discovery</span></DialogTitle>
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-2 leading-relaxed">Initiate neural link with institutional educators and directors.</p>
                                </DialogHeader>
                                <div className="p-8 pt-0 space-y-6">
                                    <div className="relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-700 group-focus-within:text-eduGreen-500 transition-all" />
                                        <Input
                                            placeholder="Search Teacher or Director Name..."
                                            className="pl-14 h-16 bg-zinc-900/50 border-zinc-900 rounded-2xl text-white font-bold text-xs focus:border-eduGreen-900 focus:bg-zinc-900 transition-all"
                                            value={staffSearchQuery}
                                            onChange={(e) => searchStaff(e.target.value)}
                                        />
                                    </div>

                                    <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                                        {searchingStaff ? (
                                            <div className="py-12 flex justify-center">
                                                <Loader2 className="w-8 h-8 text-eduGreen-500 animate-spin opacity-50" />
                                            </div>
                                        ) : staffResults.length > 0 ? (
                                            staffResults.map(staff => (
                                                <button
                                                    key={staff.id}
                                                    onClick={() => startStaffChat(staff.id)}
                                                    className="w-full flex items-center gap-4 p-4 bg-zinc-900/40 rounded-2xl border border-transparent hover:border-eduGreen-900/30 hover:bg-zinc-900 transition-all text-left group"
                                                >
                                                    <div className="w-12 h-12 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center font-black text-xs text-zinc-500 group-hover:text-eduGreen-500 transition-all">
                                                        {staff.name[0]}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-black text-sm text-white uppercase tracking-tight truncate">{staff.name}</div>
                                                        <div className="text-[8px] font-black text-zinc-600 uppercase tracking-widest mt-1 flex items-center gap-2">
                                                            <div className={cn("w-1.5 h-1.5 rounded-full", staff.role === 'PRINCIPAL' ? "bg-amber-500" : "bg-eduGreen-500")} />
                                                            {staff.role}
                                                        </div>
                                                    </div>
                                                    <MessageSquare className="w-4 h-4 text-zinc-800 group-hover:text-eduGreen-500 transition-all" />
                                                </button>
                                            ))
                                        ) : staffSearchQuery.length >= 2 ? (
                                            <div className="py-12 text-center">
                                                <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">No matching staff discovered</p>
                                            </div>
                                        ) : (
                                            <div className="py-12 text-center">
                                                <Shield className="w-8 h-8 text-zinc-900 mx-auto mb-4" />
                                                <p className="text-[10px] font-black text-zinc-800 uppercase tracking-widest">Staff Index Standby</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </DialogContent>
                        </Dialog>
                        <Button
                            onClick={() => setIsAdding(true)}
                            className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 shadow-eduGreen-900/20"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Link Student
                        </Button>
                    </div>
                )}
            </div>

            {/* Loading State */}
            {loadingStudents ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center">
                    <SpringingLoader message="Synchronizing Family Terminal" />
                </div>
            ) : isAdding ? (
                <div className="max-w-2xl mx-auto py-12">
                    <Card className="relative bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[3rem] overflow-hidden shadow-2xl border-t-zinc-800/20">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-eduGreen-600 via-emerald-500 to-transparent" />

                        <CardHeader className="p-12 pb-6">
                            <div className="flex justify-between items-start mb-8">
                                <Button
                                    variant="ghost"
                                    onClick={() => setIsAdding(false)}
                                    className="p-0 h-auto hover:bg-transparent text-zinc-700 hover:text-white transition-colors group/back"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover/back:border-eduGreen-500 transition-all">
                                            <ArrowLeft className="w-4 h-4" />
                                        </div>
                                        <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Abort Sink</span>
                                    </div>
                                </Button>
                                <div className="w-16 h-16 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-xl">
                                    <GraduationCap className="h-8 w-8 text-eduGreen-500" />
                                </div>
                            </div>
                            <CardTitle className="text-4xl font-black text-white tracking-tight">Student Authentication</CardTitle>
                            <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-3">
                                Enter the tactical student identifier provided by the institution
                            </CardDescription>
                        </CardHeader>

                        <CardContent className="px-12 pb-12 space-y-8">
                            {status === 'SUCCESS' ? (
                                <div className="text-center py-12 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-eduGreen-950/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-eduGreen-900/50">
                                        <CheckCircle2 className="w-10 h-10 text-eduGreen-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Protocol Established</h3>
                                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-3">Synchronizing family dashboard...</p>
                                </div>
                            ) : (status === 'CONFIRMING' || status === 'LINKING') && foundStudent ? (
                                <div className="bg-zinc-900/20 rounded-[2rem] p-8 border border-zinc-900 animate-in fade-in slide-in-from-bottom-8">
                                    <div className="grid gap-4">
                                        <div className="flex items-center gap-5 p-6 bg-zinc-950/50 rounded-2xl border border-zinc-900">
                                            <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                                <User className="h-7 w-7 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Full Name</p>
                                                <p className="text-xl font-black text-white tracking-tight">{foundStudent.firstName} {foundStudent.lastName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5 p-6 bg-zinc-950/50 rounded-2xl border border-zinc-900">
                                            <div className="w-14 h-14 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800">
                                                <School className="h-7 w-7 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Institutional Context</p>
                                                <p className="text-xl font-black text-white tracking-tight">{foundStudent.schoolName} • Grade {foundStudent.gradeLevel}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="mt-6 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-[0.1em] flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                        </div>
                                    )}

                                    <div className="flex gap-4 mt-10">
                                        <Button
                                            variant="ghost"
                                            onClick={() => { setStatus('IDLE'); setFoundStudent(null); }}
                                            className="flex-1 h-16 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
                                        >
                                            Decline
                                        </Button>
                                        <Button
                                            onClick={confirmLink}
                                            className="flex-1 h-16 bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
                                            disabled={status === 'LINKING'}
                                        >
                                            {status === 'LINKING' ? <Loader2 className="w-5 h-5 animate-spin" /> : "Accept Protocol"}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={verifyCode} className="space-y-8">
                                    <div className="space-y-5">
                                        <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-3">Digital Token</label>
                                        <Input
                                            placeholder="STU-XXXX-XXXX"
                                            value={code}
                                            onChange={e => setCode(e.target.value.toUpperCase())}
                                            className="text-center text-4xl font-black tracking-[0.3em] uppercase h-28 bg-zinc-900/30 border-zinc-900 text-white focus:border-eduGreen-600 transition-all border-2 rounded-[2.5rem]"
                                            maxLength={10}
                                            required
                                            disabled={status === 'VERIFYING'}
                                        />
                                    </div>

                                    {error && (
                                        <div className="p-4 bg-red-950/20 border border-red-900/30 rounded-2xl text-[10px] font-black text-red-500 flex items-center justify-center gap-3">
                                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                        </div>
                                    )}

                                    <div className="pt-4">
                                        <Button
                                            type="submit"
                                            className="w-full h-20 bg-white text-black hover:bg-zinc-200 rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] transition-all"
                                            disabled={status === 'VERIFYING'}
                                        >
                                            {status === 'VERIFYING' ? <Loader2 className="w-6 h-6 animate-spin" /> : "Initiate Verification"}
                                        </Button>
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : students.length > 0 ? (
                <>
                    <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
                        {students.map((child) => (
                            <Card key={child.id} className="group relative bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[3rem] overflow-hidden hover:border-eduGreen-900/40 transition-all border-t-zinc-800/20 shadow-2xl">
                                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-eduGreen-600 via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <CardHeader className="p-6 pb-4">
                                    <div className="flex items-start justify-between gap-6 mb-4">
                                        <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-xl group-hover:border-eduGreen-900/20 transition-all">
                                            <span className="text-xl font-black text-eduGreen-500">{child.firstName[0]}</span>
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="px-3 py-1 rounded-xl bg-zinc-900/50 border border-zinc-900 text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-eduGreen-600 group-hover:border-eduGreen-900/20 transition-all">
                                                Active Profile
                                            </div>
                                            <span className="text-[8px] font-mono text-zinc-700 font-bold uppercase tracking-wider">
                                                {child.studentCode}
                                            </span>
                                        </div>
                                    </div>
                                    <CardTitle className="text-2xl font-black text-white transition-colors tracking-tight leading-tight">{child.firstName} {child.lastName}</CardTitle>
                                    <div className="flex items-center gap-4 mt-2">
                                        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Grade {child.grade?.level || "N/A"}</span>
                                        <div className="w-1.5 h-1.5 rounded-full bg-zinc-900" />
                                        <span className="text-[9px] font-black text-eduGreen-800 uppercase tracking-tighter truncate max-w-[140px]">{child.school?.name}</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-6 pt-2 space-y-4">
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-900">
                                            <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-2">Attendance</p>
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-eduGreen-500 animate-pulse shadow-[0_0_10px_rgba(33,201,141,0.5)]" />
                                                <span className="text-lg font-black text-white">{child.stats?.attendancePct || "100.0"}%</span>
                                            </div>
                                        </div>
                                        <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-900">
                                            <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-2">Academic AVG</p>
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="w-4 h-4 text-eduGreen-500" />
                                                <span className="text-lg font-black text-white">{child.stats?.averageScore || "0.0"}%</span>
                                            </div>
                                        </div>
                                    </div>

                                    <Button className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-zinc-900 hover:border-zinc-700 transition-all shadow-lg">
                                        Access Performance Logs
                                    </Button>

                                    {(child.userId || child.class?.homeroomTeacherId) && (
                                        <div className="grid gap-3 pt-2">
                                            {child.userId && (
                                                <Link href={`/dashboard/messages?userId=${child.userId}`}>
                                                    <Button className="w-full h-12 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-zinc-900 hover:border-zinc-700 transition-all shadow-lg">
                                                        <MessageSquare className="w-4 h-4 mr-2" /> Message {child.firstName}
                                                    </Button>
                                                </Link>
                                            )}
                                            {child.class?.homeroomTeacherId && (
                                                <Link href={`/dashboard/messages?userId=${child.class.homeroomTeacherId}`}>
                                                    <Button className="w-full h-12 bg-eduGreen-900/10 hover:bg-eduGreen-900/20 text-eduGreen-500 hover:text-eduGreen-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-eduGreen-900/20 hover:border-eduGreen-800/30 transition-all">
                                                        <MessageSquare className="w-4 h-4 mr-2" /> Message Teacher
                                                    </Button>
                                                </Link>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    <div className="mt-12">
                        <UpcomingEventsWidget />
                    </div>
                </>
            ) : null}
        </div>
    );
}
