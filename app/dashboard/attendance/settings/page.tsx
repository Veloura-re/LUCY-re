"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, ShieldCheck, Clock, CheckCircle2, AlertCircle, Loader2, Sparkles } from "lucide-react";
import { SpringingLoader } from "@/components/dashboard/springing-loader";

export default function AttendanceSettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [success, setSuccess] = useState(false);

    const [config, setConfig] = useState({
        type: "PERIOD", // PERIOD or DAILY
        lockAfterMinutes: 30,
        enableLateMarking: true,
        autoAbsentAfterMinutes: 45
    });

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch('/api/school/attendance-config');
            const data = await res.json();
            if (data.config) {
                setConfig(data.config);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSuccess(false);
        try {
            const res = await fetch('/api/school/attendance-config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (res.ok) {
                setSuccess(true);
                setTimeout(() => setSuccess(false), 3000);
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
                <SpringingLoader message="Retrieving System Protocols" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white">
                        Attendance <span className="text-eduGreen-500 italic">Logic</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Advanced Institutional Presence Verification</p>
                </div>

                <Button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 transition-all active:scale-95 mb-1"
                >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : success ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {saving ? "Syncing..." : success ? "Protocols Saved" : "Commit Changes"}
                </Button>
            </div>

            <div className="grid gap-8">
                {/* Tracking Mode */}
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 hover:border-eduGreen-900/30 transition-all rounded-[2.5rem] overflow-hidden group shadow-2xl">
                    <CardHeader className="p-8 border-b border-zinc-900/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                                <Settings className="w-5 h-5 text-eduGreen-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-white tracking-tight">Tracking Architecture</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Define the granularity of presence monitoring</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                        <div className="flex items-center justify-between gap-8">
                            <div className="space-y-1">
                                <h4 className="font-black text-zinc-100 uppercase tracking-widest text-sm">Period-Wise Verification</h4>
                                <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider leading-relaxed max-w-sm">
                                    Teachers mark attendance for every individual period (default). Highly granular.
                                </p>
                            </div>
                            <Switch
                                checked={config.type === "PERIOD"}
                                onCheckedChange={(checked) => setConfig({ ...config, type: checked ? "PERIOD" : "DAILY" })}
                                className="data-[state=checked]:bg-eduGreen-600"
                            />
                        </div>

                        <div className="flex items-center justify-between gap-8">
                            <div className="space-y-1">
                                <h4 className="font-black text-zinc-100 uppercase tracking-widest text-sm">Legacy Daily Mode</h4>
                                <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider leading-relaxed max-w-sm">
                                    A single attendance record for the entire academic day.
                                </p>
                            </div>
                            <Switch
                                checked={config.type === "DAILY"}
                                onCheckedChange={(checked) => setConfig({ ...config, type: checked ? "DAILY" : "PERIOD" })}
                                className="data-[state=checked]:bg-eduGreen-600"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Locking & Time Constraints */}
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 hover:border-eduGreen-900/30 transition-all rounded-[2.5rem] overflow-hidden group shadow-2xl">
                    <CardHeader className="p-8 border-b border-zinc-900/50">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-zinc-900 rounded-2xl border border-zinc-800">
                                <Clock className="w-5 h-5 text-eduGreen-500" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black text-white tracking-tight">Temporal Constraints</CardTitle>
                                <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Enforce record integrity with automatic locking</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 space-y-10">
                        <div className="grid md:grid-cols-2 gap-10">
                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-1">Lock After (Minutes)</Label>
                                <Input
                                    type="number"
                                    value={config.lockAfterMinutes}
                                    onChange={(e) => setConfig({ ...config, lockAfterMinutes: parseInt(e.target.value) })}
                                    className="h-14 bg-zinc-900/50 border-zinc-800 text-white font-black rounded-xl focus:border-eduGreen-600 transition-all border-2"
                                />
                                <p className="text-[9px] text-zinc-600 font-bold uppercase">Records become immutable after this duration.</p>
                            </div>

                            <div className="space-y-4">
                                <Label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-1">Auto-Absent Threshold</Label>
                                <Input
                                    type="number"
                                    value={config.autoAbsentAfterMinutes}
                                    onChange={(e) => setConfig({ ...config, autoAbsentAfterMinutes: parseInt(e.target.value) })}
                                    className="h-14 bg-zinc-900/50 border-zinc-800 text-white font-black rounded-xl focus:border-eduGreen-600 transition-all border-2"
                                />
                                <p className="text-[9px] text-zinc-600 font-bold uppercase">Mark students absent if not verified within this time.</p>
                            </div>
                        </div>

                        <div className="flex items-center justify-between gap-8 pt-6 border-t border-zinc-900">
                            <div className="space-y-1">
                                <h4 className="font-black text-zinc-100 uppercase tracking-widest text-sm">Late Marking Capability</h4>
                                <p className="text-xs text-zinc-600 font-bold uppercase tracking-wider leading-relaxed max-w-sm">
                                    Allow instructors to designate students as "Late" instead of just Present/Absent.
                                </p>
                            </div>
                            <Switch
                                checked={config.enableLateMarking}
                                onCheckedChange={(checked) => setConfig({ ...config, enableLateMarking: checked })}
                                className="data-[state=checked]:bg-eduGreen-600"
                            />
                        </div>
                    </CardContent>
                </Card>

                <div className="p-10 bg-eduGreen-950/10 border border-eduGreen-900/20 rounded-[2.5rem] flex items-center gap-6">
                    <div className="w-16 h-16 rounded-3xl bg-eduGreen-600 flex items-center justify-center shrink-0 shadow-2xl shadow-eduGreen-900/40">
                        <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-widest">Protocol Warning</h4>
                        <p className="text-[10px] font-bold text-zinc-600 leading-relaxed uppercase mt-1">
                            Shifting tracking architecture mid-term may result in historical data fragmentation. Ensure all faculty members are briefed on new locking thresholds to prevent synchronization errors.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
