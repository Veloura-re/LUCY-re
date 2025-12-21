"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { User, Shield, Bell, Zap, LogOut, Loader2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";

export default function SettingsPage() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
    const [formData, setFormData] = useState({
        name: "",
        bio: "",
        preferences: {
            immersiveVisuals: true,
            neuralSync: true,
            analyticExport: false,
            emailAlerts: true,
            pushSignals: true,
            chatSounds: true
        }
    });

    const [passwordData, setPasswordData] = useState({
        current: "",
        new: "",
        confirm: ""
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/user/settings');
            const data = await res.json();
            if (data.user) {
                setUserData(data.user);
                setFormData({
                    name: data.user.name || "",
                    bio: data.user.bio || "",
                    preferences: data.user.preferences || {
                        immersiveVisuals: true,
                        neuralSync: true,
                        analyticExport: false,
                        emailAlerts: true,
                        pushSignals: true,
                        chatSounds: true
                    }
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/user/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                // Success feedback
            }
        } catch (e) {
            console.error(e);
        } finally {
            setTimeout(() => setSaving(false), 1000);
        }
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new !== passwordData.confirm) {
            alert("New passwords do not match.");
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/user/password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentPassword: passwordData.current, newPassword: passwordData.new })
            });
            const data = await res.json();
            if (res.ok) {
                alert("Security protocols updated successfully.");
                setPasswordData({ current: "", new: "", confirm: "" });
            } else {
                alert(data.error || "Uplink failed.");
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    const updatePreference = (key: string, value: boolean) => {
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [key]: value
            }
        }));
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="w-10 h-10 text-eduGreen-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest mb-4">
                        <Shield className="w-3 h-3 text-eduGreen-500" />
                        <span>System Configuration</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">System Settings</h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm leading-relaxed max-w-2xl">
                        Optimize your institutional experience and manage security protocols.
                    </p>
                </div>

                <Button
                    onClick={handleSave}
                    isLoading={saving}
                    className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 transition-all active:scale-95"
                >
                    {saving ? "Synchronizing..." : "Save Changes"}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-2">
                    {[
                        { id: 'profile', icon: User, label: "Profile Identity" },
                        { id: 'security', icon: Shield, label: "Security Layer" },
                        { id: 'notifications', icon: Bell, label: "Signal Feed" },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id as any)}
                            className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${activeTab === item.id ? 'bg-zinc-900 text-white border border-zinc-800 shadow-xl' : 'text-zinc-600 hover:text-zinc-400 hover:bg-zinc-950/50'}`}
                        >
                            <item.icon className={`w-4 h-4 ${activeTab === item.id ? 'text-eduGreen-500' : 'text-zinc-800'}`} />
                            {item.label}
                        </button>
                    ))}
                    <div className="pt-6">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-900 hover:text-red-500 hover:bg-red-950/10 transition-all font-black text-[10px] uppercase tracking-widest"
                        >
                            <LogOut className="w-4 h-4" />
                            Terminate Session
                        </button>
                    </div>
                </div>

                {/* Settings Form */}
                <div className="lg:col-span-9 space-y-8">
                    {activeTab === 'profile' && (
                        <Card className="bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-black text-zinc-100 tracking-tight leading-tight">Identity Matrix</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Global administrative parameters</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-6 space-y-10">
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Profile Name</Label>
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2 font-black"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Communications Node</Label>
                                        <Input
                                            disabled
                                            value={userData?.email || ""}
                                            className="bg-zinc-900/30 border-zinc-800 text-white/50 h-14 rounded-2xl border-2 font-black cursor-not-allowed"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Professional Summary</Label>
                                    <textarea
                                        className="w-full bg-zinc-900/30 border-zinc-800 text-white p-6 rounded-[2rem] focus:border-eduGreen-600 transition-all border-2 font-bold text-sm min-h-[120px] resize-none outline-none"
                                        value={formData.bio}
                                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                                        placeholder="Enter your professional summary..."
                                    />
                                </div>

                                <div className="p-6 bg-eduGreen-950/10 border border-eduGreen-900/20 rounded-[2rem] flex items-center justify-between">
                                    <div>
                                        <p className="font-black text-zinc-100 text-sm tracking-tight">Immersive Visuals</p>
                                        <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none mt-1">Advanced shaders & glassmorphism</p>
                                    </div>
                                    <Switch
                                        checked={(formData.preferences as any).immersiveVisuals}
                                        onCheckedChange={(checked) => updatePreference('immersiveVisuals', checked)}
                                        className="data-[state=checked]:bg-eduGreen-600"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'security' && (
                        <Card className="bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-black text-zinc-100 tracking-tight leading-tight">Security Layer</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Encryption and access protocols</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-6 space-y-8">
                                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                                    <div className="space-y-3">
                                        <Label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Current Authorization Key</Label>
                                        <Input
                                            type="password"
                                            value={passwordData.current}
                                            onChange={e => setPasswordData(prev => ({ ...prev, current: e.target.value }))}
                                            className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2 font-black"
                                        />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">New Security Hash</Label>
                                            <Input
                                                type="password"
                                                value={passwordData.new}
                                                onChange={e => setPasswordData(prev => ({ ...prev, new: e.target.value }))}
                                                className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2 font-black"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Confirm New Hash</Label>
                                            <Input
                                                type="password"
                                                value={passwordData.confirm}
                                                onChange={e => setPasswordData(prev => ({ ...prev, confirm: e.target.value }))}
                                                className="bg-zinc-900/30 border-zinc-800 text-white h-14 rounded-2xl focus:border-eduGreen-600 transition-all border-2 font-black"
                                            />
                                        </div>
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-zinc-900 hover:bg-eduGreen-600 text-white h-14 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-zinc-800 transition-all"
                                    >
                                        Update Security Protocol
                                    </Button>
                                </form>

                                <div className="pt-6 border-t border-zinc-900">
                                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-4">Active Session Logs</p>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-4 bg-zinc-900/20 border border-zinc-900 rounded-xl">
                                            <div className="flex items-center gap-3">
                                                <Zap className="w-4 h-4 text-eduGreen-500" />
                                                <div className="text-[11px] font-bold text-zinc-300">Windows PC • Chrome</div>
                                            </div>
                                            <div className="text-[9px] font-black text-eduGreen-500 uppercase">Current Node</div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {activeTab === 'notifications' && (
                        <Card className="bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 rounded-[2.5rem] overflow-hidden border-t-zinc-800/20 shadow-2xl">
                            <CardHeader className="p-8 pb-4">
                                <CardTitle className="text-2xl font-black text-zinc-100 tracking-tight leading-tight">Signal Feed</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Communication and alert preferences</CardDescription>
                            </CardHeader>
                            <CardContent className="p-8 pt-6 space-y-4">
                                {[
                                    { title: "Universal Neural Sync", desc: "Real-time master notification relay", key: "neuralSync" },
                                    { title: "Email Alert Matrix", desc: "Asynchronous updates for critical events", key: "emailAlerts" },
                                    { title: "Dynamic Push Signals", desc: "Mobile and desktop persistent alerts", key: "pushSignals" },
                                    { title: "Chat Audio Feedback", desc: "Auditory signaling for new messages", key: "chatSounds" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between p-6 bg-zinc-900/40 rounded-[2rem] border border-zinc-900 hover:border-zinc-800 transition-all">
                                        <div className="space-y-1">
                                            <p className="font-black text-zinc-100 tracking-tight text-sm uppercase">{item.title}</p>
                                            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest leading-none">{item.desc}</p>
                                        </div>
                                        <Switch
                                            checked={(formData.preferences as any)[item.key]}
                                            onCheckedChange={(checked) => updatePreference(item.key, checked)}
                                            className="data-[state=checked]:bg-eduGreen-600"
                                        />
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}

