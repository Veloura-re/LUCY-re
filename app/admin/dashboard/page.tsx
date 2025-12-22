"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, School, Users, GraduationCap, Copy, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { ConfirmationModal, AlertModal } from "@/components/ui/confirmation-modal";

interface School {
    id: string;
    name: string;
    schoolCode: string;
    status: string;
    createdAt: string;
    _count: {
        users: number;
        students: number;
        grades: number;
    };
}

export default function SuperAdminDashboard() {
    const [schools, setSchools] = useState<School[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newSchoolName, setNewSchoolName] = useState("");
    const [directorEmail, setDirectorEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [inviteUrl, setInviteUrl] = useState<string | null>(null);
    const [inviteToken, setInviteToken] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Modal State
    const [confirmAction, setConfirmAction] = useState<{ type: 'SUSPEND' | 'DELETE' | null, schoolId: string, schoolName: string }>({ type: null, schoolId: "", schoolName: "" });
    const [alertConfig, setAlertConfig] = useState<{ title: string, message: string, isOpen: boolean, variant?: "info" | "success" | "error" }>({ title: "", message: "", isOpen: false, variant: "info" });

    useEffect(() => {
        fetchSchools();
    }, []);

    const fetchSchools = async () => {
        try {
            const res = await fetch('/api/admin/schools');
            if (!res.ok) throw new Error('Failed to fetch schools');
            const data = await res.json();
            setSchools(data.schools || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const [emailSent, setEmailSent] = useState(false);
    const [emailError, setEmailError] = useState<string | null>(null);

    const handleCreateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsCreating(true);
        setEmailSent(false);
        setEmailError(null);

        try {
            const res = await fetch('/api/admin/schools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newSchoolName, directorEmail }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create school');
            }

            const data = await res.json();
            setInviteUrl(data.inviteUrl);
            setInviteToken(data.inviteToken);
            setEmailSent(data.emailSent);
            setEmailError(data.emailError);
            setNewSchoolName("");
            setDirectorEmail("");

            // Refresh school list
            fetchSchools();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleSuspendSchool = (schoolId: string) => {
        const school = schools.find(s => s.id === schoolId);
        setConfirmAction({ type: 'SUSPEND', schoolId, schoolName: school?.name || "Institution" });
    };

    const executeSuspend = async () => {
        if (!confirmAction.schoolId) return;
        setIsLoading(true);

        try {
            const res = await fetch(`/api/admin/schools/${confirmAction.schoolId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'SUSPENDED' }),
            });

            if (!res.ok) throw new Error('Failed to suspend school');

            fetchSchools(); // Refresh list
        } catch (err: any) {
            setAlertConfig({ title: "Infrastructure Failure", message: err.message, isOpen: true, variant: "error" });
        } finally {
            setConfirmAction({ type: null, schoolId: "", schoolName: "" });
            setIsLoading(false);
        }
    };

    const handleActivateSchool = async (schoolId: string) => {
        try {
            const res = await fetch(`/api/admin/schools/${schoolId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'ACTIVE' }),
            });

            if (!res.ok) throw new Error('Institutional reactivation sequence failed');
            fetchSchools(); // Refresh list
        } catch (err: any) {
            setAlertConfig({
                title: 'Authorization Fault',
                message: err.message,
                isOpen: true,
                variant: 'error'
            });
        }
    };

    const handleDeleteSchool = (schoolId: string, schoolName: string) => {
        setConfirmAction({ type: 'DELETE', schoolId, schoolName });
    };

    const executeDelete = async () => {
        if (!confirmAction.schoolId) return;
        setIsLoading(true);

        try {
            const res = await fetch(`/api/admin/schools/${confirmAction.schoolId}`, {
                method: 'DELETE',
            });

            if (!res.ok) throw new Error('Failed to delete school');

            fetchSchools(); // Refresh list
        } catch (err: any) {
            setAlertConfig({ title: "Termination Failed", message: err.message, isOpen: true, variant: "error" });
        } finally {
            setConfirmAction({ type: null, schoolId: "", schoolName: "" });
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        if (text) {
            navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: "Total Schools", value: schools.length, icon: School, desc: "Educational Ecosystems" },
                    { label: "Total Staff", value: schools.reduce((sum, s) => sum + s._count.users, 0), icon: Users, desc: "Platform Contributors" },
                    { label: "Total Students", value: schools.reduce((sum, s) => sum + s._count.students, 0), icon: GraduationCap, desc: "Active Learners" }
                ].map((stat, i) => (
                    <Card key={i} className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/50 hover:border-eduGreen-500/30 transition-all duration-500 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-eduGreen-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 relative z-10">
                            <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-eduGreen-500 transition-colors">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className="h-4 w-4 text-zinc-600 group-hover:text-eduGreen-500 group-hover:scale-110 transition-all" />
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold text-white mb-1">{stat.value}</div>
                            <p className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider">{stat.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Actions & Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Create School Form */}
                <div className="lg:col-span-5">
                    <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/80 shadow-2xl rounded-[2rem] overflow-hidden">
                        <CardHeader className="border-b border-zinc-900/80 pb-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-eduGreen-900/20 rounded-xl border border-eduGreen-900/30">
                                    <Plus className="w-5 h-5 text-eduGreen-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-bold text-white">Scale Ecosystem</CardTitle>
                                    <CardDescription className="text-zinc-500 font-normal">Provision new school environment</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-8 pb-8">
                            <form onSubmit={handleCreateSchool} className="space-y-6">
                                <div className="space-y-5">
                                    <Input
                                        label="Institution Name"
                                        placeholder="International Academy"
                                        value={newSchoolName}
                                        onChange={e => setNewSchoolName(e.target.value)}
                                        required
                                        className="rounded-2xl h-14"
                                    />
                                    <Input
                                        label="Director Email"
                                        type="email"
                                        placeholder="director@lucy.edu"
                                        value={directorEmail}
                                        onChange={e => setDirectorEmail(e.target.value)}
                                        required
                                        className="rounded-2xl h-14"
                                    />
                                </div>

                                {error && (
                                    <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl text-xs text-red-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                        <p className="font-bold">{error}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-eduGreen-900/20"
                                    isLoading={isCreating}
                                >
                                    Initialize School
                                </Button>
                            </form>

                            {inviteToken && (
                                <div className="mt-8 p-6 bg-zinc-950 border border-zinc-900 rounded-[2rem] space-y-6 animate-in zoom-in-95 duration-500">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-eduGreen-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                            <span className="text-sm font-semibold uppercase tracking-wider text-eduGreen-500">Institutional Provision Active</span>
                                        </div>
                                        {emailSent ? (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[9px] font-black text-eduGreen-500 uppercase tracking-widest">
                                                <CheckCircle2 className="w-3 h-3" />
                                                <span>Email Sent</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-amber-950/20 border border-amber-900/30 text-[9px] font-black text-amber-500 uppercase tracking-widest">
                                                <AlertCircle className="w-3 h-3" />
                                                <span>Simulation Mode</span>
                                            </div>
                                        )}
                                    </div>

                                    {!emailSent && (
                                        <div className="p-4 bg-amber-950/10 border border-amber-900/20 rounded-2xl">
                                            <p className="text-[10px] font-bold text-zinc-500 leading-relaxed uppercase">
                                                Email dispatch was bypassed due to missing credentials. Please provide the secret key and URL below to the school director manually.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest ml-1">Master Deployment Key</label>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 font-mono text-lg text-eduGreen-400 tracking-[0.2em] text-center shadow-inner">
                                                    {inviteToken}
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => copyToClipboard(inviteToken || "")}
                                                    variant="outline"
                                                    className="h-14 w-14 rounded-xl border-zinc-800 hover:border-eduGreen-500/30 transition-all"
                                                >
                                                    {copied ? <CheckCircle2 className="w-5 h-5 text-eduGreen-500" /> : <Copy className="w-5 h-5" />}
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-semibold text-zinc-600 uppercase tracking-widest ml-1">Direct Invite URL</label>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-zinc-400 truncate shadow-inner">
                                                    {inviteUrl}
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={() => copyToClipboard(inviteUrl || "")}
                                                    variant="outline"
                                                    className="h-14 w-14 rounded-xl border-zinc-800 hover:border-eduGreen-500/30 transition-all"
                                                >
                                                    <Copy className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => { setInviteToken(null); setInviteUrl(null); }}
                                        className="w-full bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-white h-12 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all"
                                    >
                                        Deploy Another Institution
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Managed Schools List */}
                <div className="lg:col-span-7">
                    <Card className="bg-transparent border-none shadow-none">
                        <CardHeader className="px-0 pt-0 pb-6 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-bold text-white">Active Infrastructure</CardTitle>
                                <CardDescription className="text-zinc-500 font-normal">Running instances across regions</CardDescription>
                            </div>
                        </CardHeader>
                        <CardContent className="px-0">
                            {isLoading ? (
                                <div className="flex flex-col items-center justify-center py-20 gap-4">
                                    <Loader2 className="w-10 h-10 animate-spin text-eduGreen-600" />
                                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-700">Accessing Core DB...</p>
                                </div>
                            ) : schools.length === 0 ? (
                                <div className="text-center py-20 bg-zinc-900/20 border border-zinc-900 border-dashed rounded-[2rem]">
                                    <p className="text-zinc-600 font-bold uppercase tracking-widest text-xs">No active schools detected</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {schools.map((school) => (
                                        <div key={school.id} className="group relative overflow-hidden bg-zinc-900/30 backdrop-blur-sm border border-zinc-800/80 rounded-[2rem] p-6 hover:border-eduGreen-500/20 transition-all duration-300">
                                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className="h-16 w-16 rounded-[1.25rem] bg-zinc-950 flex items-center justify-center border border-zinc-800 shadow-inner group-hover:border-eduGreen-900/30 transition-colors">
                                                        <School className="h-8 w-8 text-eduGreen-600 group-hover:text-eduGreen-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xl font-bold text-white tracking-tight">{school.name}</p>
                                                        <p className="text-xs font-mono text-zinc-600 tracking-widest mt-0.5 uppercase">HWID: {school.schoolCode}</p>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-8">
                                                    {/* Stats for school */}
                                                    <div className="flex gap-6">
                                                        {[
                                                            { label: 'Staff', val: school._count.users },
                                                            { label: 'Students', val: school._count.students },
                                                            { label: 'Grades', val: school._count.grades }
                                                        ].map((s, idx) => (
                                                            <div key={idx} className="text-center">
                                                                <div className="text-sm font-semibold text-zinc-300">{s.val}</div>
                                                                <div className="text-[10px] font-medium uppercase tracking-tighter text-zinc-600">{s.label}</div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Status Badge */}
                                                    <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-semibold uppercase tracking-widest border ${school.status === 'ACTIVE'
                                                        ? 'bg-eduGreen-900/10 text-eduGreen-500 border-eduGreen-900/30'
                                                        : 'bg-red-950/20 text-red-500 border-red-900/30'
                                                        }`}>
                                                        {school.status}
                                                    </span>

                                                    {/* Actions */}
                                                    <div className="flex gap-2">
                                                        {school.status === 'ACTIVE' ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleSuspendSchool(school.id)}
                                                                className="text-[10px] font-semibold uppercase text-zinc-500 hover:text-yellow-500 hover:bg-yellow-900/10"
                                                            >
                                                                Suspend
                                                            </Button>
                                                        ) : (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleActivateSchool(school.id)}
                                                                className="text-[10px] font-semibold uppercase text-zinc-500 hover:text-eduGreen-500 hover:bg-eduGreen-950/10"
                                                            >
                                                                Activate
                                                            </Button>
                                                        )}
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDeleteSchool(school.id, school.name)}
                                                            className="text-[10px] font-semibold uppercase text-zinc-600 hover:text-red-500 hover:bg-red-900/10"
                                                        >
                                                            Terminate
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <ConfirmationModal
                isOpen={confirmAction.type !== null}
                onClose={() => setConfirmAction({ type: null, schoolId: "", schoolName: "" })}
                onConfirm={confirmAction.type === 'DELETE' ? executeDelete : executeSuspend}
                isLoading={isLoading}
                title={confirmAction.type === 'DELETE' ? "Permanent Institutional Purge" : "Ecosystem Suspension"}
                description={confirmAction.type === 'DELETE'
                    ? `⚠️ CRITICAL: You are about to PERMANENTLY expunge "${confirmAction.schoolName}". This will irrecoverably delete all students, staff, classes, and academic records. Proceed with extreme caution.`
                    : `Suspend access for "${confirmAction.schoolName}". All active sessions will be terminated and institution nodes will go offline.`
                }
                confirmText={confirmAction.type === 'DELETE' ? "Expunge Everything" : "Suspend Access"}
                variant={confirmAction.type === 'DELETE' ? "danger" : "warning"}
            />

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
