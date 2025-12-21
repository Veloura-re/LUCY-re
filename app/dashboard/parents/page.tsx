"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Users, MessageSquare, Shield, Mail, GraduationCap } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/utils/supabase/client";
import { SpringingLoader } from "@/components/dashboard/springing-loader";

export default function ParentsPage() {
    const [parents, setParents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [me, setMe] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        const init = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setMe(user);
        };
        init();
        fetchParents();
    }, []);

    const fetchParents = async () => {
        try {
            const res = await fetch('/api/school/parents');
            const data = await res.json();
            if (data.parents) setParents(data.parents);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const filteredParents = parents.filter(p =>
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <SpringingLoader message="Scanning Guardian Identification Protocols" />
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
                        <span>Guardian Registry</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Parental Directory</h1>
                    <p className="text-zinc-500 mt-2 font-bold text-sm leading-relaxed max-w-2xl">
                        Monitor active parent accounts, manage student links, and facilitate direct institutional communication.
                    </p>
                </div>
            </div>

            <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/80 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-zinc-700/30">
                <CardHeader className="p-8 border-b border-zinc-900/80 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <CardTitle className="text-xl font-black text-white tracking-tight">System Guardians</CardTitle>
                        <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Authorized Parent/Guardian Accounts</CardDescription>
                    </div>
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-700" />
                        <Input
                            placeholder="Search names or emails..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 w-full bg-zinc-950/50 border-zinc-900 text-white placeholder:text-zinc-800 focus:border-eduGreen-900/50 h-12 rounded-xl transition-all border-2 font-bold text-sm tracking-tight"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="divide-y divide-zinc-900/80">
                        {loading ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-8 h-8 rounded-full border-2 border-eduGreen-500 border-t-transparent animate-spin" />
                                <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">Accessing Database...</p>
                            </div>
                        ) : filteredParents.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-900 flex items-center justify-center opacity-20">
                                    <Shield className="w-8 h-8 text-white" />
                                </div>
                                <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">No guardians detected</p>
                            </div>
                        ) : (
                            filteredParents.map((parent, idx) => (
                                <div key={idx} className="p-6 flex items-center justify-between hover:bg-eduGreen-900/5 transition-all group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-zinc-900 flex items-center justify-center font-black text-zinc-600 uppercase group-hover:border-eduGreen-900/30 transition-colors shadow-2xl text-lg relative overflow-hidden">
                                            {parent.name?.[0] || parent.email?.[0]}
                                            <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div>
                                            <p className="font-black text-zinc-100 group-hover:text-white transition-colors tracking-tight text-lg">{parent.name || "Awaiting Setup"}</p>
                                            <div className="flex flex-wrap items-center gap-3 mt-1">
                                                <div className="flex items-center gap-2">
                                                    <Mail className="w-3 h-3 text-zinc-700" />
                                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest">{parent.email}</p>
                                                </div>
                                                <div className="w-1 h-1 rounded-full bg-zinc-800" />
                                                <div className="flex items-center gap-2">
                                                    <GraduationCap className="w-3.5 h-3.5 text-zinc-700" />
                                                    <span className="text-[9px] font-black text-eduGreen-900 uppercase tracking-tighter">
                                                        {parent.parentLinks?.length || 0} Linked Students
                                                    </span>
                                                </div>
                                            </div>
                                            {parent.parentLinks?.length > 0 && (
                                                <div className="flex gap-2 mt-2">
                                                    {parent.parentLinks.map((link: any, lidx: number) => (
                                                        <span key={lidx} className="px-2 py-0.5 rounded-md bg-zinc-950 border border-zinc-900 text-[8px] font-bold text-zinc-500 uppercase tracking-widest group-hover:border-zinc-800 group-hover:text-zinc-400 transition-all">
                                                            {link.student.firstName} {link.student.lastName}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        {me?.user_metadata?.role !== 'PARENT' && (
                                            <Link href={`/dashboard/messages?userId=${parent.id}`}>
                                                <Button
                                                    variant="ghost"
                                                    className="h-12 px-6 rounded-xl border border-zinc-900 bg-zinc-950/50 hover:bg-eduGreen-950/20 hover:border-eduGreen-900/30 text-zinc-400 hover:text-eduGreen-500 transition-all font-black text-[10px] uppercase tracking-widest"
                                                >
                                                    <MessageSquare className="w-4 h-4 mr-2" />
                                                    Direct Chat
                                                </Button>
                                            </Link>
                                        )}
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
