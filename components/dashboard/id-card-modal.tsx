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
                                        <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Guardian Registry</h3>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Primary Contact</p>
                                            <p className="text-xs font-bold text-white uppercase truncate">{user.guardianName || "N/A"}</p>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">Relation</p>
                                            <p className="text-[9px] font-bold text-eduGreen-500 uppercase">{user.guardianRelation || "Guardian"}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-1 bg-zinc-900/40 p-3 rounded-xl border border-zinc-900/50">
                                        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest mb-1">Emergency Frequency</p>
                                        <div className="flex items-center gap-2 text-white font-bold text-xs">
                                            <Phone className="w-3 h-3 text-eduGreen-600" />
                                            {user.guardianPhone || "N/A"}
                                        </div>
                                    </div>
                                </div>

                                {/* QR Section Area */}
                                <div className="relative z-10 w-40 flex flex-col items-center gap-4 shrink-0 border-l border-zinc-900/50 pl-8">
                                    <div className="relative p-3 bg-white rounded-[15px] shadow-[0_0_40px_rgba(255,255,255,0.05)] group/qr hover:scale-105 transition-transform duration-500">
                                        <QRCode
                                            value={qrValue}
                                            size={100}
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

                {/* PRINT VERSION (Standard ID-1 Landscape: 85.60mm x 53.98mm) */}
                <div className="hidden">
                    <div ref={componentRef} className="print:block bg-white text-black p-0 m-0 overflow-hidden">
                        <div className="flex flex-col gap-[2mm] p-[5mm]">
                            {/* Front Side Print Landscape */}
                            <div className="relative w-[85.60mm] h-[53.98mm] border-[0.5pt] border-zinc-200 rounded-[3.18mm] overflow-hidden flex flex-col bg-white">
                                <div className="h-[8mm] bg-zinc-50 flex items-center justify-between px-[4mm] border-b-[0.5pt]">
                                    <span className="text-[6pt] font-black uppercase tracking-[0.2em]">{schoolName}</span>
                                    <span className="text-[5pt] font-black uppercase text-zinc-400">{roleTitle}</span>
                                </div>
                                <div className="flex-1 flex flex-row items-center p-[4mm] gap-[5mm]">
                                    <div className="w-[20mm] h-[20mm] rounded-[3mm] overflow-hidden bg-zinc-100 border-[0.5pt] shrink-0">
                                        {user.photoUrl ? (
                                            <img src={user.photoUrl} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[18pt] font-black text-zinc-200">{initial}</div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-[2mm]">
                                        <h2 className="text-[12pt] font-black uppercase tracking-tight leading-tight">{fullName}</h2>
                                        <div className="grid grid-cols-2 gap-[2mm] border-t-[0.5pt] pt-[2mm]">
                                            <div>
                                                <p className="text-[4pt] font-black uppercase text-zinc-400">ID Code</p>
                                                <p className="text-[7pt] font-bold">{code}</p>
                                            </div>
                                            <div>
                                                <p className="text-[4pt] font-black uppercase text-zinc-400">Class</p>
                                                <p className="text-[6pt] font-bold">{user.class?.grade?.name} • {user.class?.name}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="h-[5mm] bg-zinc-50 border-t-[0.5pt] flex items-center justify-center opacity-30">
                                    <span className="text-[4pt] font-black uppercase">Official Secure Identification</span>
                                </div>
                            </div>

                            {/* Back Side Print Landscape */}
                            <div className="relative w-[85.60mm] h-[53.98mm] border-[0.5pt] border-zinc-200 rounded-[3.18mm] overflow-hidden flex flex-row bg-white p-[5mm] items-center gap-[5mm]">
                                <div className="flex-1 space-y-[3mm]">
                                    <div className="border-b-[0.5pt] pb-[2mm]">
                                        <h3 className="text-[5pt] font-black uppercase tracking-widest text-zinc-400 mb-[1mm]">Guardian Data</h3>
                                        <p className="text-[8pt] font-bold uppercase">{user.guardianName}</p>
                                    </div>
                                    <div className="space-y-[1mm]">
                                        <p className="text-[4pt] font-black uppercase text-zinc-400">Emergency Link</p>
                                        <p className="text-[7pt] font-bold text-black">{user.guardianPhone}</p>
                                    </div>
                                </div>

                                <div className="w-[30mm] flex flex-col items-center shrink-0 border-l-[0.5pt] pl-[5mm]">
                                    <div className="p-1 border-[0.5pt] border-zinc-100 rounded">
                                        <QRCode value={qrValue} size={70} />
                                    </div>
                                    <p className="text-[4pt] font-black uppercase tracking-widest text-zinc-300 mt-[2mm]">Verification Hub</p>
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
