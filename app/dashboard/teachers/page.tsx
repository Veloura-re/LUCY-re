"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Mail, Copy, Check, Trash2, ShieldCheck, UserCheck, MailCheck, Users, Loader2, Search, MessageSquare, AlertCircle, Pencil } from "lucide-react";
import Link from "next/link";

// ... (imports remain)

// ...


import { createClient } from "@/utils/supabase/client";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { ConfirmationModal, AlertModal } from "@/components/ui/confirmation-modal";
import { IDCardModal } from "@/components/dashboard/id-card-modal";
import { ImageUpload } from "@/components/ui/image-upload";
import { EditTeacherModal } from "@/components/dashboard/edit-teacher-modal";

export default function TeachersPage() {
    const [teachers, setTeachers] = useState<any[]>([]);
    const [stats, setStats] = useState({ active: 0, pending: 0 });
    const [isInviting, setIsInviting] = useState(false);
    const [newTeacher, setNewTeacher] = useState({
        name: "", email: "", phone: "", qualification: "", teacherCode: "", photoUrl: ""
    });
    const [inviteResult, setInviteResult] = useState<{ token: string, user: any } | null>(null);
    const [inviteLink, setInviteLink] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [copied, setCopied] = useState(false);
    const [me, setMe] = useState<any>(null);

    // Modal State
    const [confirmDeleteEmail, setConfirmDeleteEmail] = useState<string | null>(null);
    const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, isOpen: boolean, variant?: "info" | "success" | "error" }>({ title: "", message: "", isOpen: false, variant: "info" });
    const [selectedTeacherForID, setSelectedTeacherForID] = useState<any>(null);
    const [selectedTeacherForEdit, setSelectedTeacherForEdit] = useState<any>(null);
    const [schoolInfo, setSchoolInfo] = useState<{ name: string, address: string } | null>(null);

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
                if (data.school) setSchoolInfo(data.school);

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

    const handleAddTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setEmailSent(false);
        setEmailError(null);
        try {
            const res = await fetch('/api/school/teachers', {
                method: 'POST',
                body: JSON.stringify(newTeacher)
            });
            const data = await res.json();
            if (data.token) {
                setInviteResult({ token: data.token, user: data.user });
                setInviteLink(`${window.location.origin}/invite/${data.token}`); // Keep for display
                setEmailSent(true); // Assuming API handles sending
                fetchTeachers();
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (email: string) => {
        setConfirmDeleteEmail(email);
    };

    const executeDelete = async () => {
        if (!confirmDeleteEmail) return;
        setIsLoading(true);

        try {
            const res = await fetch('/api/school/teachers/delete', {
                method: 'DELETE',
                body: JSON.stringify({ email: confirmDeleteEmail })
            });

            if (res.ok) {
                fetchTeachers();
            } else {
                setAlertConfig({
                    title: "Access Revocation Failed",
                    message: "Tactical override failed. The personnel record remains locked by synchronized data streams.",
                    isOpen: true,
                    variant: "error"
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setConfirmDeleteEmail(null);
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        if (!inviteResult) return;
        navigator.clipboard.writeText(`${window.location.origin}/invite/${inviteResult.token}`);
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
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Academic <span className="text-eduGreen-500 italic">Personnel</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Institutional Faculty & Staff Registry</p>
                </div>

                <Button
                    onClick={() => setIsInviting(!isInviting)}
                    className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 transition-all active:scale-95 mb-1"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    {isInviting ? "Close Console" : "Invite Faculty"}
                </Button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                    { label: "Active Faculty", value: stats.active, sub: "Verified Personnel" },
                    { label: "Pending Access", value: stats.pending, sub: "Awaiting Uplink" }
                ].map((stat, i) => (
                    <Card key={i} className="bg-zinc-950/20 border-zinc-900 rounded-3xl p-8 hover:border-eduGreen-900/30 transition-all border-t-zinc-800/20">
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-700 mb-2">{stat.label}</p>
                        <p className="text-4xl font-black text-white">{stat.value}</p>
                        <p className="text-[9px] font-bold text-zinc-800 uppercase tracking-widest mt-2">{stat.sub}</p>
                    </Card>
                ))}
            </div>

            {isInviting && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                        <CardHeader className="text-center pt-10 pb-6">
                            <div className="mx-auto w-14 h-14 bg-zinc-900 rounded-2xl flex items-center justify-center mb-6 border border-zinc-800">
                                {inviteResult ? <MailCheck className="w-6 h-6 text-eduGreen-500" /> : <Mail className="w-6 h-6 text-eduGreen-500" />}
                            </div>
                            <CardTitle className="text-xl font-black text-white tracking-tight">
                                {inviteResult ? "Deployment Successful" : "Secure Invite Portal"}
                            </CardTitle>
                            <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-2">
                                {inviteResult ? "Invitation has been dispatched" : "Generate encrypted access credentials"}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="px-10 pb-10">
                            {!inviteResult ? (
                                <form onSubmit={handleAddTeacher} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Faculty Profile</label>
                                        <div className="p-4 bg-zinc-900/30 rounded-2xl border border-zinc-800/50 flex justify-center">
                                            <ImageUpload
                                                value={newTeacher.photoUrl}
                                                onChange={(url) => setNewTeacher({ ...newTeacher, photoUrl: url })}
                                                bucket="avatars"
                                            />
                                        </div>
                                        <Input
                                            placeholder="Full Name"
                                            value={newTeacher.name}
                                            onChange={e => setNewTeacher({ ...newTeacher, name: e.target.value })}
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Email Address"
                                            type="email"
                                            value={newTeacher.email}
                                            onChange={e => setNewTeacher({ ...newTeacher, email: e.target.value })}
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Input
                                            placeholder="Phone Number (Optional)"
                                            value={newTeacher.phone}
                                            onChange={e => setNewTeacher({ ...newTeacher, phone: e.target.value })}
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <Input
                                            placeholder="Qualification / Title (e.g. M.Sc. Physics)"
                                            value={newTeacher.qualification}
                                            onChange={e => setNewTeacher({ ...newTeacher, qualification: e.target.value })}
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2"
                                        />
                                    </div>

                                    <div className="md:col-span-2 pt-4">
                                        <Button type="submit" isLoading={isLoading} className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20">
                                            Register & Dispatch Invite
                                        </Button>
                                    </div>
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
                                        <p className="text-lg font-black text-white tracking-tight break-all">{inviteResult.user.email}</p>
                                        <p className="text-xs font-bold text-zinc-500 mt-1">{inviteResult.user.name}</p>
                                        <div className="mt-6 flex items-center justify-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-eduGreen-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                            <span className="text-[10px] text-eduGreen-500 font-black uppercase tracking-widest">Link Active & Encrypted</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <Button size="lg" onClick={() => { setInviteResult(null); setInviteLink(""); setNewTeacher({ name: "", email: "", phone: "", qualification: "", teacherCode: "", photoUrl: "" }); }} className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20">
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

            <Card className="bg-zinc-950/20 backdrop-blur-xl border-zinc-950 rounded-[2.5rem] overflow-hidden shadow-none">
                <CardHeader className="p-10 border-b border-zinc-900/30 flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-black text-white tracking-tight leading-tight">Staff Directory</CardTitle>
                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">Authorized Academic Personnel</p>
                    </div>
                    <div className="flex bg-zinc-900/30 p-1 rounded-xl border border-zinc-900/50">
                        <div className="flex items-center gap-2 px-4 py-2">
                            <Search className="w-3.5 h-3.5 text-zinc-800" />
                            <span className="text-[10px] text-zinc-800 font-black uppercase tracking-widest">Filter System</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-900/40">
                        {teachers.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-900/30 flex items-center justify-center opacity-20">
                                    <Users className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">No active personnel detected</p>
                            </div>
                        ) : (
                            teachers.map((teacher: any, idx) => (
                                <div key={idx} className="p-6 flex items-center justify-between hover:bg-eduGreen-950/5 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-16 rounded-lg bg-zinc-950 border border-zinc-900/50 flex items-center justify-center font-black text-zinc-800 uppercase group-hover:border-eduGreen-900/30 transition-colors shadow-none relative overflow-hidden text-lg">
                                            {teacher.photoUrl ? (
                                                <img src={teacher.photoUrl} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                teacher.name?.[0] || teacher.email?.[0] || "?"
                                            )}
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
                                            <div className="flex items-center gap-4">
                                                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/20 border border-amber-900/30">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                                                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Invite Sent</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        const link = `${window.location.origin}/invite/${teacher.token}`;
                                                        navigator.clipboard.writeText(link);
                                                        setAlertConfig({
                                                            title: "Uplink Secure",
                                                            message: "Faculty access credentials successfully replicated to local clipboard buffer.",
                                                            isOpen: true,
                                                            variant: "success"
                                                        });
                                                    }}
                                                    className="h-8 px-3 rounded-xl bg-zinc-950 border border-zinc-900 text-[8px] font-black uppercase tracking-widest text-zinc-600 hover:text-white transition-all"
                                                >
                                                    <Copy className="w-3 h-3 mr-1.5" /> Copy Code
                                                </Button>
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
                                            onClick={() => setSelectedTeacherForEdit(teacher)}
                                            className="w-10 h-10 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent transition-all"
                                            title="Configure Personnel"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setSelectedTeacherForID(teacher)}
                                            className="w-10 h-10 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-900 border border-transparent transition-all"
                                            title="Generate Identity Card"
                                        >
                                            <ShieldCheck className="w-4 h-4" />
                                        </Button>
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

            <ConfirmationModal
                isOpen={!!confirmDeleteEmail}
                onClose={() => setConfirmDeleteEmail(null)}
                onConfirm={executeDelete}
                isLoading={isLoading}
                title="Personnel Offboarding"
                description={`Are you sure you want to revoke system access for ${confirmDeleteEmail}? This will terminate their active session and archive their departmental clearance.`}
                confirmText="Terminate Access"
                variant="danger"
            />

            <AlertModal
                isOpen={alertConfig.isOpen}
                onClose={() => setAlertConfig(prev => ({ ...prev, isOpen: false }))}
                title={alertConfig.title}
                message={alertConfig.message}
                variant={alertConfig.variant}
            />

            <IDCardModal
                isOpen={!!selectedTeacherForID}
                onClose={() => setSelectedTeacherForID(null)}
                user={selectedTeacherForID}
                type="TEACHER"
                schoolName={schoolInfo?.name}
                schoolAddress={schoolInfo?.address}
            />

            <EditTeacherModal
                isOpen={!!selectedTeacherForEdit}
                onClose={() => setSelectedTeacherForEdit(null)}
                onSuccess={() => { fetchTeachers(); setSelectedTeacherForEdit(null); }}
                teacher={selectedTeacherForEdit}
            />
        </div >
    );
}
