"use client";

import { Sparkles } from "lucide-react";

export function SpringingLoader({ message = "Synchronizing Institutional Data" }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 gap-8 animate-in fade-in duration-700">
            {/* The 3 Points Springing */}
            <div className="flex items-center gap-4">
                <div className="w-4 h-4 rounded-full bg-eduGreen-500 shadow-[0_0_15px_rgba(20,122,82,0.5)] animate-[spring_1s_ease-in-out_infinite]" />
                <div className="w-4 h-4 rounded-full bg-eduGreen-400 shadow-[0_0_15px_rgba(26,167,104,0.5)] animate-[spring_1s_ease-in-out_0.2s_infinite]" />
                <div className="w-4 h-4 rounded-full bg-eduGreen-300 shadow-[0_0_15px_rgba(59,214,141,0.5)] animate-[spring_1s_ease-in-out_0.4s_infinite]" />
            </div>

            {/* Hooking Text */}
            <div className="space-y-3 text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[9px] font-black text-eduGreen-600 uppercase tracking-widest animate-pulse">
                    <Sparkles className="w-3 h-3" />
                    <span>LUCY System active</span>
                </div>
                <h2 className="text-white font-black text-xl tracking-tighter opacity-90">{message}...</h2>
                <div className="flex justify-center gap-1">
                    <div className="w-8 h-1 rounded-full bg-zinc-900 overflow-hidden">
                        <div className="h-full bg-eduGreen-600 w-1/2 animate-[progress-slide_2s_ease-in-out_infinite]" />
                    </div>
                </div>
            </div>
        </div>
    );
}
