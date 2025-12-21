"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { GraduationCap, Sparkles, Plus, Loader2, CheckCircle2, User, School, AlertCircle, MessageSquare, ArrowLeft, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { SpringingLoader } from "@/components/dashboard/springing-loader";

// Interface for the student data returned by API verification
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
    const router = useRouter();

    useEffect(() => {
        if (!initialChildren) {
            fetchStudents();
        } else {
            // If they are provided, we should check if they are empty and set isAdding
            if (initialChildren.length === 0) setIsAdding(true);
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
            setStatus('CONFIRMING'); // Go back to confirm state so they can retry or cancel
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest mb-4">
                        <Sparkles className="w-3 h-3 text-eduGreen-500" />
                        <span>Guardian Link</span>
                    </div>
                    <h1 className="text-4xl font-black text-dm-textMain tracking-tight">Family Portal</h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm leading-relaxed max-w-2xl">
                        Monitor academic progression cycles, institutional communications, and performance benchmarks for your students.
                    </p>
                </div>

                {students.length > 0 && !isAdding && (
                    <Button
                        onClick={() => setIsAdding(true)}
                        className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 transition-all active:scale-95"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Link Student
                    </Button>
                )}
            </div>

            {/* Loading State */}
            {loadingStudents ? (
                <div className="min-h-[60vh] flex flex-col items-center justify-center py-20">
                    <SpringingLoader message="Synchronizing Student Data" />
                </div>
            ) : isAdding ? (
                <div className="max-w-2xl mx-auto py-12">
                    <Card className="relative bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)] border-t-zinc-800/20">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-eduGreen-600 via-emerald-500 to-transparent" />

                        <div className="flex justify-between items-start mb-6">
                            <Button
                                variant="ghost"
                                onClick={() => setIsAdding(false)}
                                className="p-0 h-auto hover:bg-transparent text-zinc-700 hover:text-white transition-colors group/back"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center group-hover/back:border-eduGreen-500 transition-all">
                                        <ArrowLeft className="w-4 h-4" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest mt-0.5">Back to Dashboard</span>
                                </div>
                            </Button>
                            <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-xl">
                                <GraduationCap className="h-7 w-7 text-eduGreen-500" />
                            </div>
                        </div>
                        <CardTitle className="text-3xl font-black text-dm-textMain tracking-tight">Student Authentication</CardTitle>
                        <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-2 text-center">
                            Enter the tactical student identifier provided by the institution
                        </CardDescription>

                        <CardContent className="px-12 pb-12 space-y-8">
                            {status === 'SUCCESS' ? (
                                <div className="text-center py-12 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-eduGreen-950/30 rounded-full flex items-center justify-center mx-auto mb-6 border border-eduGreen-900/50">
                                        <CheckCircle2 className="w-10 h-10 text-eduGreen-500" />
                                    </div>
                                    <h3 className="text-2xl font-black text-dm-textMain uppercase tracking-tight">Protocol Established</h3>
                                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-[10px] mt-3">Synchronizing family dashboard...</p>
                                </div>
                            ) : (status === 'CONFIRMING' || status === 'LINKING') && foundStudent ? (
                                <div className="bg-zinc-950/80 rounded-[2rem] p-8 border border-zinc-900/80 animate-in fade-in slide-in-from-bottom-8">
                                    <div className="grid gap-4">
                                        <div className="flex items-center gap-5 p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-900">
                                                <User className="h-6 w-6 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Full Name</p>
                                                <p className="text-lg font-black text-white tracking-tight">{foundStudent.firstName} {foundStudent.lastName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-5 p-5 bg-zinc-900/40 rounded-2xl border border-zinc-800/50">
                                            <div className="w-12 h-12 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-900">
                                                <School className="h-6 w-6 text-zinc-500" />
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Institutional Context</p>
                                                <p className="text-lg font-black text-white tracking-tight">{foundStudent.schoolName} • Grade {foundStudent.gradeLevel}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="mt-6 p-4 bg-red-950/20 border border-red-900/30 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-[0.1em] flex items-center gap-3">
                                            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                        </div>
                                    )}

                                    <div className="flex gap-4 mt-8">
                                        <Button
                                            variant="ghost"
                                            onClick={() => { setStatus('IDLE'); setFoundStudent(null); }}
                                            className="flex-1 h-14 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-600 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
                                        >
                                            Decline
                                        </Button>
                                        <Button
                                            onClick={confirmLink}
                                            className="flex-1 h-14 bg-eduGreen-600 hover:bg-eduGreen-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em]"
                                            isLoading={status === 'LINKING'}
                                        >
                                            Accept Protocol
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <form onSubmit={verifyCode} className="space-y-6">
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Digital Token</label>
                                        <Input
                                            placeholder="STU-XXXX-XXXX"
                                            value={code}
                                            onChange={e => setCode(e.target.value.toUpperCase())}
                                            className="text-center text-3xl font-black tracking-[0.3em] uppercase h-24 bg-zinc-900/30 border-zinc-800 text-dm-textMain focus:border-eduGreen-600 transition-all border-2 rounded-[2rem]"
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

                                    <div className="space-y-4 pt-4">
                                        <Button
                                            type="submit"
                                            isLoading={status === 'VERIFYING'}
                                            className="w-full h-16 bg-white text-black hover:bg-zinc-200 rounded-[1.5rem] font-black text-sm uppercase tracking-[0.3em] transition-all"
                                        >
                                            Initiate Verification
                                        </Button>

                                        {students.length > 0 && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                className="w-full h-14 text-zinc-700 hover:text-white font-black uppercase tracking-[0.2em] text-[10px]"
                                                onClick={() => setIsAdding(false)}
                                            >
                                                Abort Sequential Link
                                            </Button>
                                        )}
                                    </div>
                                </form>
                            )}
                        </CardContent>
                    </Card>
                </div>
            ) : students.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {students.map((child) => (
                        <Card key={child.id} className="group relative bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 rounded-[2.5rem] overflow-hidden hover:border-eduGreen-900/40 transition-all border-t-zinc-800/20 shadow-2xl">
                            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-eduGreen-600 via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <CardHeader className="p-8 pb-4">
                                <div className="flex items-start justify-between gap-4 mb-4">
                                    <div className="w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center border border-zinc-800 shadow-xl group-hover:border-eduGreen-900/20 transition-all">
                                        <span className="text-xl font-black text-eduGreen-500">{child.firstName[0]}</span>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="px-3 py-1.5 rounded-xl bg-zinc-900/50 border border-zinc-900 text-[9px] font-black text-zinc-500 uppercase tracking-widest group-hover:text-eduGreen-600 group-hover:border-eduGreen-900/20 transition-all">
                                            Active Profile
                                        </div>
                                        <span className="text-[8px] font-mono text-zinc-700 font-bold uppercase tracking-wider group-hover:text-zinc-500 transition-colors">
                                            {child.studentCode}
                                        </span>
                                    </div>
                                </div>
                                <CardTitle className="text-2xl font-black text-dm-textMain group-hover:text-dm-textMain transition-colors tracking-tight leading-tight">{child.firstName} {child.lastName}</CardTitle>
                                <div className="flex items-center gap-3 mt-2">
                                    <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Grade {child.grade?.level || "N/A"}</span>
                                    <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                    <span className="text-[9px] font-black text-eduGreen-800 uppercase tracking-tighter truncate max-w-[120px] shadow-sm">{child.school?.name}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 pt-6 space-y-3">
                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-900 border-t-zinc-800/20">
                                        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-1">Attendance</p>
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-eduGreen-500 shadow-[0_0_8px_rgba(33,201,141,0.5)]" />
                                            <span className="text-sm font-black text-dm-textMain">96.8%</span>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-zinc-900/40 rounded-2xl border border-zinc-900 border-t-zinc-800/20">
                                        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest mb-1">Academic GPA</p>
                                        <div className="flex items-center gap-2">
                                            <Sparkles className="w-3.5 h-3.5 text-eduGreen-500" />
                                            <span className="text-sm font-black text-dm-textMain">B+ (3.4)</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-zinc-900 hover:border-zinc-700 transition-all shadow-lg"
                                >
                                    Access Performance Logs
                                </Button>

                                {child.userId && (
                                    <Link href={`/dashboard/messages?userId=${child.userId}`}>
                                        <Button
                                            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-zinc-900 hover:border-zinc-700 transition-all shadow-lg"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Message {child.firstName}
                                        </Button>
                                    </Link>
                                )}

                                {child.class?.homeroomTeacherId && (
                                    <Link href={`/dashboard/messages?userId=${child.class.homeroomTeacherId}`}>
                                        <Button
                                            className="w-full h-14 bg-eduGreen-900/10 hover:bg-eduGreen-900/20 text-eduGreen-500 hover:text-eduGreen-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-eduGreen-900/20 hover:border-eduGreen-800/30 transition-all shadow-lg"
                                        >
                                            <MessageSquare className="w-4 h-4 mr-2" />
                                            Message Teacher
                                        </Button>
                                    </Link>
                                )}

                                {child.principal && (
                                    <Link href={`/dashboard/messages?userId=${child.principal.id}`}>
                                        <Button
                                            className="w-full h-14 bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-zinc-900 hover:border-zinc-700 transition-all shadow-lg"
                                        >
                                            <Shield className="w-4 h-4 mr-2" />
                                            Message Principal
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : null}
        </div>
    );
}
