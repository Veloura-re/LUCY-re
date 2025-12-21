"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Copy, Check, Trash2, ShieldCheck, UserCheck, MailCheck, Users, Loader2, Search, MessageSquare, AlertCircle } from "lucide-react";
import Link from "next/link";

// ... (imports remain)

// ...


import { createClient } from "@/utils/supabase/client";
import { SpringingLoader } from "@/components/dashboard/springing-loader";

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [stats, setStats] = useState({ active: 0, pending: 0 });
    const [isInviting, setIsInviting] = useState(false);
    const [newTeacherEmail, setNewTeacherEmail] = useState("");
    const [inviteLink, setInviteLink] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [copied, setCopied] = useState(false);
    const [me, setMe] = useState<any>(null);

    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setMe(user);
            await fetchTeachers();
            setFetching(false);
        };
        init();
    }, []);

    const fetchTeachers = async () => {
        try {
            const res = await fetch('/api/school/teachers');
            const data = await res.json();
            if (data.teachers) {
                setTeachers(data.teachers);

                // Calc stats
                const active = data.teachers.filter((t: any) => t.status === 'ACTIVE').length;
                const pending = data.teachers.filter((t: any) => t.status === 'PENDING').length;
                setStats({ active, pending });
            }
        } catch (e) {
            console.error("Failed to fetch teachers", e);
        }
    };

    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setEmailSent(false);
        setEmailError(null);
        try {
            const res = await fetch('/api/school/invite-teacher', {
                method: 'POST',
                body: JSON.stringify({ email: newTeacherEmail })
            });
            const data = await res.json();
            if (data.token) {
                setInviteLink(`${window.location.origin}/invite/${data.token}`);
                setEmailSent(data.sent);
                setEmailError(data.emailError);
                fetchTeachers();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (email: string) => {
        if (!confirm("Are you sure you want to remove this teacher or revoke their invite?")) return;

        try {
            const res = await fetch('/api/school/teachers/delete', {
                method: 'DELETE',
                body: JSON.stringify({ email })
            });

            if (res.ok) {
                fetchTeachers();
            } else {
                alert("Failed to delete.");
            }
        } catch (e) {
            console.error(e);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (fetching) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <SpringingLoader message="Synthesizing Faculty Personnel Profiles" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest mb-4">
                        <Users className="w-3 h-3 text-eduGreen-500" />
                        <span>Personnel Management</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Academic Staff</h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm leading-relaxed max-w-2xl">
                        Manage your school's educators, assign disciplines, and monitor system access levels.
                    </p>
                </div>

                <Button
                    onClick={() => setIsInviting(!isInviting)}
                    className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 transition-all active:scale-95"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {isInviting ? "Close Console" : "Invite Faculty"}
                </Button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                    { label: "Active Staff", value: stats.active, icon: UserCheck, color: "text-eduGreen-500", desc: "Successfully onboarded" },
                    { label: "Pending Invites", value: stats.pending, icon: Mail, color: "text-amber-500", desc: "Awaiting registration" }
                ].map((stat, i) => (
                    <Card key={i} className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/50 hover:border-zinc-700 transition-all duration-500 group">
                        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0">
                            <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-white transition-colors">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color} group-hover:scale-110 transition-transform`} />
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-black text-white mb-1 tracking-tighter">{stat.value}</div>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{stat.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {isInviting && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <Card className="bg-zinc-950/50 backdrop-blur-2xl border-zinc-800/80 rounded-[2.5rem] overflow-hidden border-t-zinc-700/30">
                        <CardHeader className="text-center pt-10 pb-6">
                            <div className="mx-auto w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800">
                                {inviteLink ? <MailCheck className="w-6 h-6 text-eduGreen-500" /> : <Mail className="w-6 h-6 text-eduGreen-500" />}
                            </div>
                            <CardTitle className="text-xl font-black text-white tracking-tight">
                                {inviteLink ? "Deployment Successful" : "Secure Invite Portal"}
                            </CardTitle>
                            <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-2">
                                {inviteLink ? "Invitation has been dispatched" : "Generate encrypted access credentials"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 pb-10">
                            {!inviteLink ? (
                                <form onSubmit={handleInvite} className="flex flex-col gap-6 max-w-md mx-auto">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Teacher Email Address</label>
                                        <Input
                                            placeholder="faculty@institution.edu"
                                            type="email"
                                            value={newTeacherEmail}
                                            onChange={e => setNewTeacherEmail(e.target.value)}
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                            required
                                        />
                                    </div>
                                    <Button type="submit" isLoading={isLoading} className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20">
                                        Dispatch Secure Link
                                    </Button>
                                </form>
                            ) : (
                                <div className="text-center space-y-8 max-w-md mx-auto">
                                    <div className="p-8 bg-zinc-950/80 rounded-[2rem] border border-zinc-900 shadow-inner">
                                        {emailSent ? (
                                            <div className="flex items-center justify-center gap-3 text-eduGreen-500 mb-6">
                                                <div className="w-2 h-2 rounded-full bg-eduGreen-500 animate-pulse" />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Email Dispatched Successfully</span>
                                            </div>
                                        ) : (
                                            <div className="bg-amber-950/20 border border-amber-900/30 p-4 rounded-xl mb-6 text-left">
                                                <div className="flex items-center gap-2 text-amber-500 mb-1">
                                                    <AlertCircle className="w-4 h-4" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-500">Delivery Simulation Active</span>
                                                </div>
                                                <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase">
                                                    Institutional email downlink not verified. Please share the secret key manually with the recipient.
                                                </p>
                                            </div>
                                        )}

                                        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-widest mb-2">Authenticated Recipient</p>
                                        <p className="text-lg font-black text-white tracking-tight break-all">{newTeacherEmail}</p>
                                        <div className="mt-6 flex items-center justify-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-eduGreen-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                            <span className="text-[10px] text-eduGreen-500 font-black uppercase tracking-widest">Link Active & Encrypted</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button size="lg" onClick={() => { setInviteLink(""); setNewTeacherEmail(""); }} className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20">
                                            New Invitation
                                        </Button>
                                        <Button variant="ghost" size="sm" onClick={copyToClipboard} className="text-[10px] text-zinc-600 hover:text-eduGreen-500 font-black uppercase tracking-[0.3em] transition-colors">
                                            {copied ? "Link Copied to Clipboard" : "Manual Secret Copy"}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/80 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-zinc-700/30">
                <CardHeader className="p-8 border-b border-zinc-900/80 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-xl font-black text-white tracking-tight">Staff Directory</CardTitle>
                        <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Authorized Academic Personnel</CardDescription>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-zinc-950/50 rounded-xl border border-zinc-900">
                        <Search className="w-3.5 h-3.5 text-zinc-700" />
                        <span className="text-[10px] text-zinc-700 font-black uppercase tracking-widest">Filter System</span>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-900/80">
                        {teachers.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center opacity-20">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">No active personnel detected</p>
                            </div>
                        ) : (
                            teachers.map((teacher: any, idx) => (
                                <div key={idx} className="p-6 flex items-center justify-between hover:bg-eduGreen-900/5 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center font-black text-zinc-600 uppercase group-hover:border-eduGreen-900/30 transition-colors shadow-2xl relative overflow-hidden text-lg">
                                            {teacher.name?.[0] || teacher.email?.[0] || "?"}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div>
                                            <p className="font-black text-zinc-100 group-hover:text-white transition-colors tracking-tight text-lg">{teacher.name || "Awaiting Finalization"}</p>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{teacher.email}</p>
                                                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-tighter">Academic Faculty</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        {teacher.status === 'ACTIVE' ? (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30">
                                                <div className="w-1.5 h-1.5 rounded-full bg-eduGreen-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                                                <span className="text-[9px] font-black text-eduGreen-500 uppercase tracking-widest">Active Access</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/20 border border-amber-900/30">
                                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Invite Sent</span>
                                            </div>
                                        )}
                                        {teacher.status === 'ACTIVE' && (
                                            <Link href={`/dashboard/messages?userId=${teacher.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="w-10 h-10 rounded-xl text-zinc-400 hover:text-eduGreen-500 hover:bg-eduGreen-950/20 hover:border-eduGreen-900/30 border border-transparent transition-all"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </Button>
                                            </Link>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(teacher.email)}
                                            className="w-10 h-10 rounded-xl text-zinc-800 hover:text-red-500 hover:bg-red-950/20 hover:border-red-900/30 border border-transparent transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
