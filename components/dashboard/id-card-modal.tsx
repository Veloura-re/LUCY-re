"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck, Phone, User, Calendar, MapPin, Sparkles, RefreshCcw } from "lucide-react";
import QRCode from "react-qr-code";
import { useState, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { motion, AnimatePresence } from "framer-motion";
import { cn, calculateAge } from "@/lib/utils";

interface IDCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: any;
    type: "STUDENT" | "TEACHER";
    schoolAddress?: string;
    schoolName?: string;
}

/**
 * IDCardModal - Landscape Orientation
 * UI: 500px x 320px
 * Print: 85.60mm x 53.98mm (ID-1 Standard Landscape)
 */
export function IDCardModal({ isOpen, onClose, user, type, schoolName = "LUCY ACADEMY", schoolAddress }: IDCardModalProps) {
    const componentRef = useRef<HTMLDivElement>(null);
    const [isFlipped, setIsFlipped] = useState(false);

    const handlePrint = useReactToPrint({
        contentRef: componentRef,
        documentTitle: user ? `${user.firstName || user.name}_ID_Card` : 'ID_Card',
    });

    if (!user) return null;

    const fullName = type === "STUDENT" ? `${user.firstName} ${user.lastName}` : user.name;
    const code = type === "STUDENT" ? user.studentCode : user.teacherCode;
    const roleTitle = type === "STUDENT" ? "Student Identity" : "Faculty Identity";
    const initial = fullName ? fullName[0] : "?";
    const age = type === "STUDENT" ? calculateAge(user.dob) : null;

    const qrValue = typeof window !== 'undefined' ? `${window.location.origin}/verify/student/${user.id}` : "";

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-[600px] bg-transparent border-0 shadow-none p-0 flex flex-col items-center outline-none">

                {/* ID CARD UI CONTAINER (500px x 320px Landscape) */}
                <div
                    className="relative w-[500px] h-[320px] cursor-pointer group perspective-1000"
                    onClick={() => setIsFlipped(!isFlipped)}
                >
                    <motion.div
                        className="w-full h-full relative preserve-3d"
                        animate={{ rotateY: isFlipped ? 180 : 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 20 }}
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        {/* FRONT SIDE (UI Landscape) */}
                        <div className="absolute inset-0 w-full h-full backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}>
                            <div className="w-full h-full bg-zinc-950 border border-zinc-900 rounded-[20px] overflow-hidden relative shadow-2xl flex flex-col">
                                {/* Header */}
                                <div className="px-6 py-4 bg-gradient-to-r from-eduGreen-950/30 to-transparent flex items-center justify-between border-b border-zinc-900/50">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-lg bg-eduGreen-600 flex items-center justify-center shadow-[0_0_10px_rgba(59,214,141,0.3)]">
                                            <Sparkles className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-[10px] font-black tracking-[0.2em] text-white uppercase italic">{schoolName}</span>
                                    </div>
                                    <div className="px-3 py-0.5 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/20 text-[8px] font-black text-eduGreen-500 uppercase tracking-widest">
                                        {roleTitle}
                                    </div>
                                </div>

                                {/* Content Body */}
                                <div className="flex-1 p-6 flex items-center gap-8">
                                    {/* Photo Area */}
                                    <div className="w-32 h-32 rounded-[2rem] p-1 bg-gradient-to-tr from-eduGreen-600 to-zinc-800 shadow-2xl shrink-0">
                                        <div className="w-full h-full rounded-[1.8rem] overflow-hidden bg-zinc-950 relative border border-zinc-900">
                                            {user.photoUrl ? (
                                                <img src={user.photoUrl} alt="ID" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-zinc-950 text-4xl font-black text-zinc-800">
                                                    {initial}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Info Area */}
                                    <div className="flex-1 space-y-4">
                                        <div className="space-y-1">
                                            <h2 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">{fullName}</h2>
                                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Entity Identification Code: <span className="text-white font-mono">{code || "--------"}</span></p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 border-t border-zinc-900/50 pt-4">
                                            <div className="space-y-1">
                                                <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Level / Class</p>
                                                <p className="text-[10px] font-bold text-zinc-300 uppercase">{user.class?.grade?.name || "N/A"} • {user.class?.name || "N/A"}</p>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Age / DOB</p>
                                                <p className="text-[10px] font-bold text-zinc-300 uppercase">{age}Y • {user.dob ? new Date(user.dob).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Bar */}
                                <div className="px-6 py-3 bg-zinc-900/30 flex justify-between items-center border-t border-zinc-900/50">
                                    <div className="flex items-center gap-1 opacity-20">
                                        <ShieldCheck className="w-3 h-3 text-white" />
                                        <span className="text-[6px] font-black text-white uppercase tracking-[0.3em]">Neural Verification Active</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-eduGreen-500 animate-pulse" />
                                        <span className="text-[8px] font-bold text-eduGreen-500 uppercase tracking-widest">Standing: Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* BACK SIDE (UI Landscape) */}
                        <div className="absolute inset-0 w-full h-full backface-hidden" style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                            <div className="w-full h-full bg-zinc-950 border border-zinc-900 rounded-[20px] overflow-hidden relative shadow-2xl flex flex-row p-6 items-center gap-8">
                                <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-zinc-900/50 to-transparent opacity-50" />

                                {/* Guardian / Contact Area */}
                                <div className="relative z-10 flex-1 space-y-6">
                                    <div className="flex items-center gap-2 border-b border-zinc-900 pb-3">
                                        <User className="w-4 h-4 text-eduGreen-600" />
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Contact & Lifecycle</h3>
                                    </div>

                                    <div className="space-y-1">
                                        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Guardian Registry</p>
                                        <p className="text-xs font-bold text-white uppercase truncate">{user.guardianName || "N/A"} • <span className="text-eduGreen-500 uppercase">{user.guardianRelation || "Guardian"}</span></p>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Enrolled</p>
                                            <p className="text-[10px] font-bold text-white uppercase">{user.createdAt ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "---"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Expires</p>
                                            <p className="text-[10px] font-bold text-eduGreen-500 uppercase">{user.createdAt ? new Date(new Date(user.createdAt).setFullYear(new Date(user.createdAt).getFullYear() + 1)).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "---"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900/50">
                                        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Emergency Uplinks</p>
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-white font-bold text-xs">
                                                <Phone className="w-3 h-3 text-eduGreen-600" />
                                                {user.guardianPhone || "N/A"}
                                            </div>
                                            {user.secondaryPhone && (
                                                <div className="flex items-center gap-2 text-white/60 font-medium text-[10px] pl-5 border-l border-zinc-800">
                                                    {user.secondaryPhone}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* QR Section Area */}
                                <div className="relative z-10 w-48 flex flex-col items-center gap-4 shrink-0 border-l border-zinc-900/50 pl-8">
                                    <div className="relative p-3 bg-white rounded-[15px] shadow-[0_0_40px_rgba(255,255,255,0.05)] group/qr hover:scale-110 transition-transform duration-500">
                                        <QRCode
                                            value={qrValue}
                                            size={140}
                                            level="H"
                                            className="rounded-lg"
                                        />
                                    </div>
                                    <div className="text-center space-y-0.5">
                                        <p className="text-[7px] font-black text-zinc-500 uppercase tracking-[0.3em]">System Validation</p>
                                        <p className="text-[5px] font-bold text-zinc-700 uppercase tracking-[0.1em]">Cloud Synchronized</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    <div className="absolute -bottom-10 left-0 right-0 text-center opacity-40 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <p className="text-[8px] font-black text-zinc-500 uppercase tracking-[0.3em] flex items-center justify-center gap-2">
                            <RefreshCcw className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                            Tap to Flip Identity
                        </p>
                    </div>
                </div>

                <div className="hidden">
                    <div ref={componentRef} className="print:block bg-white text-black p-[10mm] m-0 overflow-hidden">
                        <div className="flex flex-col gap-[10mm]">
                            {/* Front Side Print Landscape */}
                            <div className="relative w-[323.5px] h-[204px] rounded-[12px] overflow-hidden flex flex-col bg-zinc-950 text-white border border-zinc-900" style={{ width: '85.60mm', height: '53.98mm' }}>
                                {/* Pattern Overlay */}
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-eduGreen-900/40 via-transparent to-transparent opacity-60" />
                                <div className="absolute bottom-0 inset-x-0 h-[10mm] bg-gradient-to-t from-black to-transparent opacity-40" />

                                <div className="relative z-10 h-[10mm] bg-black/40 flex items-center justify-between px-[5mm] border-b border-white/5">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-[3.5mm] h-[3.5mm] rounded-sm bg-eduGreen-600 flex items-center justify-center">
                                            <Sparkles className="w-[2.5mm] h-[2.5mm] text-white" />
                                        </div>
                                        <span className="text-[7pt] font-black uppercase tracking-[0.2em] italic">{schoolName}</span>
                                    </div>
                                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[5pt] font-black uppercase tracking-widest text-zinc-400">
                                        {roleTitle}
                                    </span>
                                </div>

                                <div className="relative z-10 flex-1 flex flex-row items-center p-[5mm] gap-[6mm]">
                                    <div className="w-[22mm] h-[22mm] rounded-[4mm] p-[0.3mm] bg-gradient-to-tr from-eduGreen-600 to-zinc-700 shadow-xl shrink-0">
                                        <div className="w-full h-full rounded-[3.8mm] overflow-hidden bg-black relative border border-white/5">
                                            {user.photoUrl ? (
                                                <img src={user.photoUrl} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-[22pt] font-black text-zinc-800">{initial}</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-[3mm]">
                                        <h2 className="text-[13pt] font-black uppercase tracking-tight leading-tight">{fullName}</h2>
                                        <div className="grid grid-cols-2 gap-[2mm] border-t border-white/5 pt-[3mm]">
                                            <div>
                                                <p className="text-[4.5pt] font-black uppercase text-zinc-500 tracking-widest mb-0.5">ID Frequency</p>
                                                <p className="text-[7.5pt] font-bold text-white font-mono">{code}</p>
                                            </div>
                                            <div>
                                                <p className="text-[4.5pt] font-black uppercase text-zinc-500 tracking-widest mb-0.5">Classification</p>
                                                <p className="text-[6.5pt] font-bold text-zinc-300 uppercase truncate">{user.class?.grade?.name} • {user.class?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 h-[6mm] bg-black/40 border-t border-white/5 flex items-center justify-between px-[5mm]">
                                    <div className="flex items-center gap-1 opacity-40">
                                        <ShieldCheck className="w-[3mm] h-[3mm]" />
                                        <span className="text-[4.5pt] font-black uppercase tracking-[0.2em]">Verified Registry Interface</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <div className="w-[1mm] h-[1mm] rounded-full bg-eduGreen-500 shadow-[0_0_5px_#3BD68D]" />
                                        <span className="text-[5pt] font-bold text-eduGreen-500 uppercase">Secured</span>
                                    </div>
                                </div>
                            </div>

                            {/* Back Side Print Landscape */}
                            <div className="relative w-[323.5px] h-[204px] rounded-[12px] overflow-hidden flex flex-row bg-zinc-950 text-white border border-zinc-900 p-[6mm] items-center gap-[6mm]" style={{ width: '85.60mm', height: '53.98mm' }}>
                                {/* Pattern Overlay */}
                                <div className="absolute inset-x-0 top-0 h-[15mm] bg-gradient-to-b from-white/5 to-transparent opacity-60" />

                                <div className="relative z-10 flex-1 space-y-[5mm]">
                                    <div className="border-b border-white/5 pb-[3mm]">
                                        <div className="flex items-center gap-1.5 mb-[1.5mm]">
                                            <User className="w-[3mm] h-[3mm] text-eduGreen-500" />
                                            <h3 className="text-[6pt] font-black uppercase tracking-widest text-zinc-400">Guardian Hub</h3>
                                        </div>
                                        <p className="text-[9pt] font-black uppercase leading-none">{user.guardianName || "N/A"}</p>
                                        <div className="flex justify-between items-end mt-1">
                                            <p className="text-[5pt] font-bold text-eduGreen-500 uppercase tracking-widest">{user.guardianRelation || "Authorized Guardian"}</p>
                                            <div className="text-right">
                                                <p className="text-[4pt] font-black text-zinc-500 uppercase tracking-widest leading-none">Expires</p>
                                                <p className="text-[6pt] font-bold text-white leading-none mt-0.5">{user.createdAt ? new Date(new Date(user.createdAt).setFullYear(new Date(user.createdAt).getFullYear() + 1)).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : "---"}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-[2mm] bg-white/5 p-[2.5mm] rounded-[2.5mm] border border-white/5">
                                        <p className="text-[4.5pt] font-black uppercase text-zinc-500 tracking-widest">Emergency Uplinks</p>
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-[8.5pt] font-bold text-white">{user.guardianPhone || "N/A"}</p>
                                            {user.secondaryPhone && (
                                                <p className="text-[6pt] font-medium text-white/50 pl-[3mm] border-l border-white/10">{user.secondaryPhone}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="relative z-10 w-[35mm] flex flex-col items-center shrink-0 border-l border-white/5 pl-[6mm] gap-[3mm]">
                                    <div className="p-[2.5mm] bg-white rounded-[4mm] shadow-2xl">
                                        <QRCode value={qrValue} size={110} level="H" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-[5.5pt] font-black uppercase tracking-[0.2em] text-zinc-500">Validation Protocol</p>
                                        <p className="text-[4pt] font-bold text-zinc-700 uppercase tracking-widest">Cloud Encrypted Access</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-12 mb-8">
                    <Button onClick={handlePrint} className="bg-white text-black hover:bg-zinc-200 h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl">
                        <Printer className="w-4 h-4 mr-2" /> Print Credentials
                    </Button>
                    <Button variant="outline" onClick={onClose} className="border-zinc-800 text-zinc-500 hover:text-white h-12 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                        Close
                    </Button>
                </div>
            </DialogContent>

            <style jsx global>{`
                .perspective-1000 {
                    perspective: 1000px;
                }
                @media print {
                    @page {
                        size: 85.60mm 53.98mm;
                        margin: 0;
                    }
                    body {
                        margin: 0;
                        -webkit-print-color-adjust: exact;
                    }
                }
            `}</style>
        </Dialog>
    );
}
