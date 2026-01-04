"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import {
    Search,
    Book,
    Layers,
    GraduationCap,
    Command as CommandIcon,
    X,
    FileText,
    ExternalLink,
    Zap
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export function CommandSearch() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setOpen((open) => !open);
            }
        };
        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, []);

    const fetchResults = useCallback(async (q: string) => {
        if (!q.trim()) {
            setResults([]);
            return;
        }
        setLoading(true);
        try {
            // We'll search across books, but could extend to subjects/classes
            const res = await fetch(`/api/school/books?query=${encodeURIComponent(q)}`);
            const data = await res.json();
            setResults(data.slice(0, 6)); // Limit for speed/UI
        } catch (e) {
            console.error("Search failed", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => fetchResults(query), 300);
        return () => clearTimeout(timer);
    }, [query, fetchResults]);

    const handleSelect = (book: any) => {
        setOpen(false);
        // Navigate or open book? For now, let's just go to books page with filter or open file
        window.open(book.fileUrl, '_blank');
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-zinc-950/50 border border-zinc-900 rounded-xl hover:bg-zinc-900 transition-all group"
            >
                <Search className="w-3.5 h-3.5 text-zinc-600 group-hover:text-eduGreen-500" />
                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Search Hub</span>
                <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-zinc-800 bg-zinc-900 px-1.5 font-mono text-[10px] font-medium text-zinc-500 opacity-100">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl bg-zinc-950/80 backdrop-blur-2xl border-zinc-900 shadow-2xl p-0 overflow-hidden rounded-[2.5rem] top-[20%] translate-y-0">
                    <div className="p-6 border-b border-zinc-900 flex items-center gap-4">
                        <Search className="w-5 h-5 text-eduGreen-500" />
                        <Input
                            autoFocus
                            placeholder="Type to find books, subjects, or unit packs..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="bg-transparent border-none text-lg font-bold placeholder:text-zinc-700 focus-visible:ring-0 h-12"
                        />
                        <div className="flex items-center gap-2">
                            {loading && <div className="w-4 h-4 border-2 border-eduGreen-500 border-t-transparent rounded-full animate-spin" />}
                            <button onClick={() => setOpen(false)} className="text-zinc-600 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    <div className="p-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
                        {results.length > 0 ? (
                            <div className="space-y-2">
                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2 mb-4">Library Records</p>
                                {results.map((book) => (
                                    <button
                                        key={book.id}
                                        onClick={() => handleSelect(book)}
                                        className="w-full flex items-center justify-between p-4 bg-zinc-900/40 hover:bg-eduGreen-500/10 border border-transparent hover:border-eduGreen-900/30 rounded-2xl transition-all group text-left"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-zinc-900 rounded-xl border border-zinc-800 text-zinc-500 group-hover:text-eduGreen-500 transition-colors">
                                                <Book className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white group-hover:text-eduGreen-500 transition-colors">{book.title}</h4>
                                                <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-tighter mt-1">
                                                    {book.subject.name} • Grade {book.grade.level}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[8px] font-black text-zinc-700 uppercase tracking-widest px-2 py-1 bg-zinc-950 rounded border border-zinc-900">
                                                {book.class.name}
                                            </span>
                                            <Zap className="w-3 h-3 text-zinc-800 group-hover:text-eduGreen-500" />
                                        </div>
                                    </button>
                                ))}
                            </div>
                        ) : query.trim() ? (
                            <div className="py-20 text-center">
                                <Search className="w-8 h-8 text-zinc-800 mx-auto mb-4 opacity-20" />
                                <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">No matching records found in institutional library</p>
                            </div>
                        ) : (
                            <div className="py-10">
                                <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.3em] ml-2 mb-6">Discovery Shortcuts</p>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { icon: Layers, label: "All Subjects", cmd: "S" },
                                        { icon: GraduationCap, label: "By Grade", cmd: "G" },
                                        { icon: FileText, label: "Unit Packs", cmd: "U" },
                                        { icon: ExternalLink, label: "External Links", cmd: "L" }
                                    ].map((sh) => (
                                        <div key={sh.label} className="flex items-center gap-3 p-4 bg-zinc-900/20 border border-zinc-900 rounded-2xl hover:bg-zinc-900/40 transition-all cursor-pointer">
                                            <sh.icon className="w-4 h-4 text-zinc-600" />
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{sh.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-4 bg-zinc-900/50 border-t border-zinc-900 flex justify-between items-center text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                        <div className="flex gap-4">
                            <span><kbd className="bg-zinc-950 px-1 rounded border border-zinc-800 text-zinc-500">↑↓</kbd> Navigate</span>
                            <span><kbd className="bg-zinc-950 px-1 rounded border border-zinc-800 text-zinc-500">Enter</kbd> Select</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <CommandIcon className="w-3 h-3" />
                            <span>Institutional Hub</span>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
