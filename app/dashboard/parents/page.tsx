"use client";

import { useState } from "react";
import {
    Users,
    Search,
    MessageSquare,
    Mail,
    Calendar,
    ArrowRight,
    Loader2,
    CheckCircle2,
    XCircle,
    UserCircle2,
    ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface Parent {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

interface SearchResult {
    student: {
        name: string;
        code: string;
        className?: string;
        gradeName?: string;
    };
    parents: Parent[];
}

export default function ParentsPage() {
    const [query, setQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<SearchResult | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`/api/parents/search?studentCode=${encodeURIComponent(query)}`);
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Search failed");
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    const handleStartChat = (userId: string) => {
        // Navigate to messages with a target user
        router.push(`/dashboard/messages?userId=${userId}`);
    };

    return (
        <div className="space-y-12">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest">
                        <Users className="w-3 h-3" />
                        Parent Management
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white">
                        Parent <span className="text-eduGreen-500">Inventory</span>
                    </h1>
                    <p className="text-zinc-500 font-medium max-w-xl text-sm md:text-base">
                        Locate and manage parental contacts by searching with their child's unique student key. Seamlessly connect with the family ecosystem.
                    </p>
                </div>
            </div>

            {/* Search Section */}
            <Card className="bg-zinc-900/40 border-zinc-800/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
                <CardContent className="p-8 md:p-12">
                    <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-6">
                        <div className="text-center space-y-2 mb-8">
                            <h2 className="text-xl font-bold text-zinc-100 italic font-mono tracking-tight">Search by Student Key</h2>
                            <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">Enter the unique student code (e.g., STU-XXXXXX)</p>
                        </div>

                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-eduGreen-500/20 to-emerald-500/20 rounded-[2rem] blur opacity-0 group-focus-within:opacity-100 transition duration-500" />
                            <div className="relative flex gap-3">
                                <Input
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="STU-XXXXXX"
                                    className="h-16 bg-zinc-950/80 border-2 border-zinc-800 rounded-[1.25rem] px-8 text-eduGreen-400 font-mono text-lg focus:border-eduGreen-600 transition-all placeholder:text-zinc-900"
                                />
                                <Button
                                    type="submit"
                                    disabled={isLoading}
                                    className="h-16 w-16 bg-eduGreen-600 hover:bg-eduGreen-500 rounded-[1.25rem] shrink-0 shadow-2xl shadow-eduGreen-900/20 transition-all"
                                >
                                    {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                                </Button>
                            </div>
                        </div>

                        {error && (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-red-950/20 border border-red-900/30 text-red-500 text-xs font-bold uppercase tracking-wider animate-in fade-in slide-in-from-top-2">
                                <XCircle className="w-4 h-4" />
                                {error}
                            </div>
                        )}
                    </form>
                </CardContent>
            </Card>

            {/* Results Section */}
            {result && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="flex items-center gap-4 px-2">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-eduGreen-500" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white">{result.student.name}</h3>
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-600">
                                <span>{result.student.code}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                <span>{result.student.gradeName}</span>
                                <span className="w-1 h-1 rounded-full bg-zinc-800" />
                                <span>{result.student.className}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {result.parents.length > 0 ? (
                            result.parents.map((parent) => (
                                <Card key={parent.id} className="group relative bg-zinc-900/40 border-zinc-800/80 hover:border-eduGreen-500/50 transition-all duration-500 overflow-hidden rounded-[2.5rem]">
                                    <CardContent className="p-8">
                                        <div className="flex items-start justify-between gap-6">
                                            <div className="flex items-start gap-5">
                                                <div className="w-16 h-16 rounded-2xl bg-zinc-950 border border-zinc-800 group-hover:bg-eduGreen-900/10 group-hover:border-eduGreen-900/30 flex items-center justify-center transition-all duration-500">
                                                    <UserCircle2 className="w-8 h-8 text-zinc-700 group-hover:text-eduGreen-500 transition-colors" />
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-xl font-bold text-white group-hover:text-eduGreen-400 transition-colors">{parent.name}</h4>
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                                            <Mail className="w-3 h-3" />
                                                            {parent.email}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-700 uppercase tracking-widest mt-1">
                                                            <ShieldCheck className="w-3 h-3 text-eduGreen-900" />
                                                            Verified Account
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-8 flex items-center justify-between gap-4 pt-6 border-t border-zinc-800/50">
                                            <div className="flex items-center gap-2 text-zinc-600">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span className="text-[10px] font-bold uppercase tracking-wider">
                                                    Active since {new Date(parent.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <Button
                                                onClick={() => handleStartChat(parent.id)}
                                                className="bg-zinc-950 border border-zinc-900 hover:bg-eduGreen-950/20 hover:border-eduGreen-900/50 text-zinc-500 hover:text-eduGreen-400 rounded-2xl px-6 font-black text-[10px] uppercase tracking-widest transition-all gap-2"
                                            >
                                                Direct Message <MessageSquare className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full py-20 bg-zinc-950/20 rounded-[2.5rem] border-2 border-dashed border-zinc-900 flex flex-col items-center justify-center text-center space-y-4">
                                <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center border border-zinc-800">
                                    <Users className="w-6 h-6 text-zinc-700" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">No parents linked to this student yet.</p>
                                    <p className="text-[10px] text-zinc-700">The student needs to share their code with a parent to link accounts.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {!result && !isLoading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                    {[
                        { title: "Universal Key Search", desc: "Easily find parents using only their child's unique student identifier." },
                        { title: "Direct Connectivity", desc: "Start conversations and share updates instantly from the management hub." },
                        { title: "Unified Directory", desc: "Access verified institutional contacts in a secure, central location." }
                    ].map((feature, i) => (
                        <div key={i} className="p-8 rounded-[2rem] bg-zinc-950/50 border border-zinc-900/50 space-y-3">
                            <div className="w-8 h-8 rounded-lg bg-eduGreen-950/20 border border-eduGreen-900/20 flex items-center justify-center">
                                <span className="text-eduGreen-500 font-black text-xs">{i + 1}</span>
                            </div>
                            <h5 className="text-sm font-bold text-white">{feature.title}</h5>
                            <p className="text-xs text-zinc-600 leading-relaxed font-medium">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const GraduationCap = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
    >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" />
    </svg>
);
