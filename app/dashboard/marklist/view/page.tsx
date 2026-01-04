"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Save, AlertCircle, CheckCircle2, Calculator } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// Types
// Types
interface Column {
    id: string;
    title: string;
    maxMarks: number;
    order: number;
    isOptional: boolean;
}
interface Mark {
    id?: string;
    columnId: string;
    score: number;
}
interface Entry {
    id: string; // Entry ID
    studentId: string;
    remarks: string;
    student: {
        id: string;
        firstName: string;
        lastName: string;
        studentCode: string;
    };
    marks: Mark[];
    total: number;
    percentage: number;
    grade: string;
}

export default function MarklistViewPage() {
    const searchParams = useSearchParams();
    const configId = searchParams.get("configId");

    const [config, setConfig] = useState<any>(null);
    const [entries, setEntries] = useState<Entry[]>([]);
    const [loading, setLoading] = useState(true);
    const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set()); // Set of studentIds
    const [isSaving, setIsSaving] = useState(false);

    // Real implementation of loadData
    useEffect(() => {
        if (!configId) return;

        const fetchData = async () => {
            setLoading(true);
            try {
                const confRes = await fetch(`/api/marklist/config?id=${configId}`);
                const entriesRes = await fetch(`/api/marklist/entry?configId=${configId}`);

                if (confRes.ok && entriesRes.ok) {
                    const confData = await confRes.json();
                    const entData = await entriesRes.json();

                    setConfig(confData);
                    const calculatedEntries = entData.map((e: any) => recalculateEntry(e, confData.columns));
                    setEntries(calculatedEntries);
                }
            } catch (e) {
                console.error(e);
                toast.error("Failed to load marklist");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [configId]);

    const calculateGrade = (pct: number) => {
        if (pct >= 90) return "A+";
        if (pct >= 80) return "A";
        if (pct >= 70) return "B";
        if (pct >= 60) return "C";
        if (pct >= 50) return "D";
        if (pct >= 40) return "E";
        return "F";
    };

    const getPerformanceColor = (pct: number) => {
        if (pct >= 80) return { text: "text-emerald-500", border: "border-emerald-900/30", bg: "bg-emerald-900/10", raw: "emerald" };
        if (pct >= 60) return { text: "text-blue-500", border: "border-blue-900/30", bg: "bg-blue-900/10", raw: "blue" };
        if (pct >= 40) return { text: "text-amber-500", border: "border-amber-900/30", bg: "bg-amber-900/10", raw: "amber" };
        return { text: "text-rose-500", border: "border-rose-900/30", bg: "bg-rose-900/10", raw: "rose" };
    };

    const recalculateEntry = (entry: any, columns: Column[]) => {
        let total = 0;
        let maxTotal = 0;

        columns.forEach(col => {
            const mark = entry.marks.find((m: Mark) => m.columnId === col.id);
            const score = mark ? parseFloat(mark.score) : 0;

            if (col.isOptional) {
                if (mark) {
                    total += score;
                    maxTotal += col.maxMarks;
                }
            } else {
                total += score;
                maxTotal += col.maxMarks;
            }
        });

        const pct = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

        return {
            ...entry,
            remarks: entry.remarks || "",
            total: parseFloat(total.toFixed(2)),
            percentage: parseFloat(pct.toFixed(1)),
            grade: calculateGrade(pct)
        };
    };

    const handleScoreChange = (entryIndex: number, columnId: string, val: string) => {
        const newEntries = [...entries];
        const entry = { ...newEntries[entryIndex] };
        const dimMarks = [...(entry.marks || [])];

        const existingMarkIndex = dimMarks.findIndex(m => m.columnId === columnId);

        let score = parseFloat(val);
        if (isNaN(score)) score = 0;

        const col = config.columns.find((c: Column) => c.id === columnId);
        if (col && score > col.maxMarks) {
            toast.warning(`Max marks for ${col.title} is ${col.maxMarks}`);
            score = col.maxMarks;
        }
        if (score < 0) score = 0;

        if (existingMarkIndex >= 0) {
            dimMarks[existingMarkIndex] = { ...dimMarks[existingMarkIndex], score };
        } else {
            dimMarks.push({ columnId, score });
        }

        entry.marks = dimMarks;
        newEntries[entryIndex] = recalculateEntry(entry, config.columns);

        setEntries(newEntries);
        setUnsavedChanges(prev => new Set(prev).add(entry.studentId));
    };

    const handleRemarkChange = (entryIndex: number, val: string) => {
        const newEntries = [...entries];
        newEntries[entryIndex] = { ...newEntries[entryIndex], remarks: val };
        setEntries(newEntries);
        setUnsavedChanges(prev => new Set(prev).add(newEntries[entryIndex].studentId));
    };

    const saveAll = async () => {
        if (unsavedChanges.size === 0) return;
        setIsSaving(true);

        const updates: any[] = [];
        entries.forEach(e => {
            if (unsavedChanges.has(e.studentId)) {
                updates.push({
                    studentId: e.studentId,
                    remarks: e.remarks,
                    marks: e.marks.map(m => ({
                        columnId: m.columnId,
                        score: m.score
                    }))
                });
            }
        });

        try {
            const res = await fetch("/api/marklist/entry", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ configId, updates })
            });

            const data = await res.json();

            if (res.ok) {
                setUnsavedChanges(new Set());
                toast.success("Marks & Remarks saved");
            } else {
                toast.error(data.error || "Failed to save changes");
            }
        } catch (e) {
            toast.error("Network error");
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return <div className="p-10 text-center animate-pulse text-zinc-600 font-black uppercase tracking-widest text-[10px]">Accessing Central Ledger...</div>;
    if (!config) return <div className="p-10 text-center text-red-500 font-black">Configuration Missing</div>;

    return (
        <div className="flex flex-col h-screen max-h-screen bg-zinc-950">
            {/* Header */}
            <div className=" border-b border-zinc-900/50 px-8 py-6 flex items-center justify-between bg-zinc-950/50 backdrop-blur-xl shrink-0">
                <div>
                    <h2 className="text-2xl font-black uppercase tracking-tighter text-white">
                        {config.class?.name} <span className="text-eduGreen-500 italic">::</span> {config.subject?.name}
                    </h2>
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.3em] mt-1">Academic Performance Matrix</p>
                </div>

                <div className="flex items-center gap-6">
                    {unsavedChanges.size > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-amber-950/20 border border-amber-900/30 animate-in fade-in zoom-in duration-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                            <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest leading-none">Buffers Out of Sync</span>
                        </div>
                    )}
                    <Button
                        onClick={saveAll}
                        disabled={isSaving || unsavedChanges.size === 0}
                        className={cn(
                            "h-12 px-10 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all",
                            unsavedChanges.size > 0
                                ? "bg-eduGreen-600 hover:bg-eduGreen-500 text-white shadow-2xl shadow-eduGreen-900/30 active:scale-95"
                                : "bg-zinc-900 text-zinc-600 border border-zinc-800 pointer-events-none"
                        )}
                    >
                        {isSaving ? "Syncing Logic..." : "Commit Changes"}
                    </Button>
                </div>
            </div>

            {/* Grid Area */}
            <div className="flex-1 overflow-auto p-12 custom-scrollbar">
                <div className="rounded-[2.5rem] border border-zinc-900/30 bg-zinc-950/30 shadow-2xl overflow-hidden backdrop-blur-sm">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="bg-zinc-900/20 text-[9px] uppercase font-black tracking-[0.2em] text-zinc-600 sticky top-0 z-10 backdrop-blur-xl">
                            <tr>
                                <th className="px-8 py-5 w-16 text-center">#</th>
                                <th className="px-8 py-5 min-w-[220px]">Student Entity</th>
                                <th className="px-8 py-5 w-32 border-r border-zinc-900/20">Access Code</th>

                                {config.columns.map((col: Column) => (
                                    <th key={col.id} className="px-4 py-5 min-w-[130px] text-center border-r border-zinc-900/20 bg-zinc-900/10">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-zinc-300">{col.title}</span>
                                            <span className="text-[7px] text-zinc-600 opacity-70">MAX {col.maxMarks}</span>
                                        </div>
                                    </th>
                                ))}

                                <th className="px-8 py-5 w-24 text-center bg-eduGreen-950/10 text-eduGreen-600">Total</th>
                                <th className="px-8 py-5 w-24 text-center bg-eduGreen-950/20 text-eduGreen-500 border-r border-zinc-900/20">%</th>
                                <th className="px-8 py-5 w-20 text-center border-r border-zinc-900/20">Grade</th>
                                <th className="px-8 py-5 min-w-[200px]">Strategic Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-900/20">
                            {entries.map((entry, idx) => (
                                <tr key={entry.id} className="group hover:bg-eduGreen-950/5 transition-all">
                                    <td className="px-8 py-4 font-black text-[10px] text-zinc-800 text-center group-hover:text-zinc-600">{idx + 1}</td>
                                    <td className="px-8 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-extrabold text-zinc-100 uppercase tracking-tight leading-tight">{entry.student.firstName} {entry.student.lastName}</span>
                                            <span className="text-[7px] font-black text-zinc-800 uppercase tracking-widest mt-1">Authorized Profile</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 font-mono text-[9px] text-zinc-600 border-r border-zinc-900/20 tracking-tighter">
                                        {entry.student.studentCode}
                                    </td>

                                    {config.columns.map((col: Column) => {
                                        const mark = entry.marks.find(m => m.columnId === col.id);
                                        const score = mark ? mark.score : "";

                                        return (
                                            <td key={col.id} className="p-2 border-r border-zinc-900/20 text-center">
                                                <input
                                                    type="number"
                                                    value={score}
                                                    placeholder="--"
                                                    onChange={(e) => handleScoreChange(idx, col.id, e.target.value)}
                                                    className={cn(
                                                        "w-full h-10 bg-transparent border-0 text-center font-black text-lg focus:ring-1 focus:ring-eduGreen-600/30 rounded-lg placeholder:text-zinc-900 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                                                        score === "" ? "text-zinc-800" : getPerformanceColor((parseFloat(score.toString()) / col.maxMarks) * 100).text
                                                    )}
                                                />
                                            </td>
                                        );
                                    })}

                                    <td className={cn(
                                        "px-8 py-4 text-center font-black text-lg bg-eduGreen-950/5 group-hover:bg-eduGreen-950/10 transition-all",
                                        getPerformanceColor(entry.percentage).text.replace('500', '700')
                                    )}>
                                        {entry.total}
                                    </td>
                                    <td className={cn(
                                        "px-8 py-4 text-center font-black text-lg bg-eduGreen-950/10 group-hover:bg-eduGreen-950/20 transition-all border-r border-zinc-900/20",
                                        getPerformanceColor(entry.percentage).text
                                    )}>
                                        {Math.round(entry.percentage)}
                                    </td>
                                    <td className="px-8 py-4 text-center border-r border-zinc-900/20">
                                        <div className={cn(
                                            "inline-flex items-center justify-center w-10 h-10 rounded-xl font-black text-[11px] shadow-2xl",
                                            getPerformanceColor(entry.percentage).bg,
                                            getPerformanceColor(entry.percentage).text,
                                            getPerformanceColor(entry.percentage).border
                                        )}>
                                            {entry.grade}
                                        </div>
                                    </td>
                                    <td className="px-4 py-2">
                                        <textarea
                                            value={entry.remarks}
                                            onChange={(e) => handleRemarkChange(idx, e.target.value)}
                                            placeholder="Enter faculty observation..."
                                            className="w-full bg-zinc-900/30 border border-zinc-900/50 rounded-xl px-4 py-2 text-[10px] font-bold text-zinc-400 focus:border-eduGreen-900/50 focus:bg-zinc-950 focus:text-white transition-all outline-none resize-none h-12"
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
