"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogClose
} from "@/components/ui/dialog";
import {
    X,
    Maximize2,
    Minimize2,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    Download,
    ZoomIn,
    ZoomOut,
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface FlipBookViewerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    fileUrl: string;
}

export function FlipBookViewer({ isOpen, onClose, title, fileUrl }: FlipBookViewerProps) {
    const [fullScreen, setFullScreen] = useState(false);
    const [zoom, setZoom] = useState(1);

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className={cn(
                "bg-zinc-950/90 backdrop-blur-3xl border-zinc-900 shadow-2xl p-0 overflow-hidden transition-all duration-500",
                fullScreen ? "max-w-[100vw] h-[100vh] rounded-none" : "max-w-6xl h-[85vh] rounded-[3rem]"
            )}>
                {/* Header/Toolbar */}
                <div className="p-6 border-b border-zinc-900 flex justify-between items-center bg-zinc-900/30">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-eduGreen-500/10 rounded-xl border border-eduGreen-500/20 text-eduGreen-500">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white tracking-tight uppercase leading-none">{title}</h2>
                            <p className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-2 italic">Institutional Intellectual Property</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-xl px-2 h-10 gap-2">
                            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="w-8 h-8 text-zinc-500 hover:text-white">
                                <ZoomOut className="w-4 h-4" />
                            </Button>
                            <span className="text-[10px] font-black text-zinc-600 w-10 text-center">{Math.round(zoom * 100)}%</span>
                            <Button variant="ghost" size="icon" onClick={() => setZoom(z => Math.min(2, z + 0.1))} className="w-8 h-8 text-zinc-500 hover:text-white">
                                <ZoomIn className="w-4 h-4" />
                            </Button>
                        </div>

                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setFullScreen(!fullScreen)}
                            className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 rounded-xl h-10 w-10"
                        >
                            {fullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                        </Button>

                        <DialogClose asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl h-10 w-10 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </DialogClose>
                    </div>
                </div>

                {/* Reader Engine Overlay */}
                <div className="relative flex-1 bg-zinc-950 overflow-auto scrollbar-hide flex items-center justify-center p-12">
                    <iframe
                        src={`${fileUrl}#toolbar=0&view=FitH&zoom=${zoom * 100}`}
                        className="w-full h-full border-none shadow-2xl rounded-xl bg-white"
                        style={{ maxWidth: '100%', maxHeight: '100%' }}
                        title={title}
                    />
                </div>

                {/* Footer Controls */}
                <div className="p-8 border-t border-zinc-900 flex justify-between items-center bg-zinc-900/30">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" className="h-10 px-6 bg-zinc-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
                            <ChevronLeft className="w-4 h-4" /> Previous
                        </Button>
                        <span className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">Page Tracking Active</span>
                        <Button variant="ghost" className="h-10 px-6 bg-zinc-900 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest gap-2">
                            Next <ChevronRight className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-4 py-2 bg-eduGreen-500/5 border border-eduGreen-500/10 rounded-lg">
                            <Eye className="w-3.5 h-3.5 text-eduGreen-500" />
                            <span className="text-[9px] font-black text-eduGreen-500 uppercase tracking-tighter">Reading Session Optimized</span>
                        </div>
                        <Button asChild variant="ghost" className="h-10 w-10 p-0 bg-zinc-900 text-zinc-500 hover:text-white rounded-xl">
                            <a href={fileUrl} download><Download className="w-4 h-4" /></a>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ');
}
