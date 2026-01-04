"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSpreadsheet, ArrowRight, Loader2 } from "lucide-react";

export default function MarklistIndexPage() {
    const router = useRouter();
    const [configs, setConfigs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all marklists (filtered by teacher serverside ideally, or client side)
        // Since I don't have a "My Marklists" API yet, I'll fetch generic or just assume we show all for now.
        // Actually, I can allow the user to just see what's available.
        // I'll reuse the config API or create a listing API.
        // Let's create a quick listing endpoint client-side logic? 
        // No, I need an API. 
        // I'll create a new API route `GET /api/marklist/list` quickly or just use `GET /api/marklist/config` without params?
        // My previous API required params. I'll modify `GET /api/marklist/config` to return ALL if no params provided (filtered by school).

        fetchConfigs();
    }, []);

    const fetchConfigs = async () => {
        try {
            const res = await fetch("/api/marklist/config/list"); // New Endpoint
            if (res.ok) {
                setConfigs(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
            <div>
                <h1 className="text-3xl font-black uppercase tracking-tight text-white">My Marklists</h1>
                <p className="text-zinc-400 font-bold">Select a Marklist to manage grades</p>
            </div>

            {loading ? (
                <div className="flex justify-center p-20"><Loader2 className="animate-spin" /></div>
            ) : configs.length === 0 ? (
                <Card className="bg-zinc-900 border-zinc-800">
                    <CardContent className="p-10 text-center text-zinc-500 font-medium">
                        No Marklists configured yet. Ask your Director to create one.
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {configs.map((conf) => (
                        <Card key={conf.id} className="group bg-zinc-900/50 border-zinc-800 hover:border-eduGreen-500/50 transition-all cursor-pointer overflow-hidden relative"
                            onClick={() => router.push(`/dashboard/marklist/view?configId=${conf.id}`)}>
                            <div className="absolute top-0 bottom-0 left-0 w-1 bg-zinc-800 group-hover:bg-eduGreen-500 transition-colors" />
                            <CardHeader>
                                <CardTitle className="text-xl font-black text-white">{conf.class?.name}</CardTitle>
                                <div className="text-eduGreen-400 font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    {conf.subject?.name}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="flex justify-between items-center mt-4">
                                    <span className="text-zinc-500 text-xs font-bold uppercase">{conf.columns?.length || 0} Assessments</span>
                                    <Button size="sm" variant="ghost" className="text-zinc-400 group-hover:text-eduGreen-400 group-hover:translate-x-1 transition-all">
                                        Open Chart <ArrowRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
