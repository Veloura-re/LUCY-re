"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    CreditCard,
    ArrowRight,
    CheckCircle2,
    Clock,
    AlertCircle,
    User,
    GraduationCap,
    ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from 'next/link';

interface ParentBillingViewProps {
    user: any;
    students: any[];
}

export function ParentBillingView({ user, students }: ParentBillingViewProps) {
    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                        Billing <span className="text-eduGreen-500 not-italic">Nexus</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Family Financial Terminal & Protocol Monitor</p>
                </div>

                <div className="flex items-center gap-3 mb-1">
                    <div className="px-5 py-3 rounded-2xl bg-zinc-950/50 border border-zinc-900 flex items-center gap-3">
                        <ShieldCheck className="w-4 h-4 text-eduGreen-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Secure Link Established</span>
                    </div>
                </div>
            </div>

            {students.length === 0 ? (
                <div className="py-32 text-center bg-zinc-950/20 rounded-[3rem] border border-dashed border-zinc-900">
                    <div className="w-16 h-16 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-900 mx-auto mb-6">
                        <User className="w-8 h-8 text-zinc-800" />
                    </div>
                    <p className="text-zinc-700 font-black uppercase tracking-[0.3em] text-[10px]">No Student Profiles Linked to Terminal</p>
                    <Link href="/dashboard">
                        <Button variant="ghost" className="text-eduGreen-500 mt-4 font-black uppercase tracking-widest text-[9px]">Establish Student Link</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-12">
                    {students.map((student) => (
                        <div key={student.id} className="space-y-8">
                            <div className="flex items-center gap-4 ml-4">
                                <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-xl">
                                    <span className="text-xl font-black text-eduGreen-500">{student.firstName[0]}</span>
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black text-white tracking-tight leading-none">{student.firstName} {student.lastName}</h2>
                                    <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">ID: {student.studentCode} • Grade {student.grade?.level || "N/A"}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {student.invoices?.length === 0 ? (
                                    <Card className="md:col-span-3 bg-zinc-950/30 border-zinc-900 border-dashed rounded-[2.5rem] py-16 text-center">
                                        <p className="text-zinc-800 font-black uppercase tracking-[0.4em] text-[10px]">No Active Invoices for this Subject</p>
                                    </Card>
                                ) : (
                                    student.invoices.map((invoice: any) => (
                                        <Card key={invoice.id} className="group bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden hover:border-eduGreen-900/30 transition-all border-t-zinc-800/10 shadow-2xl relative">
                                            <div className={cn(
                                                "absolute top-0 left-0 w-full h-[2px] transition-opacity",
                                                invoice.status === 'PAID' ? "bg-eduGreen-500" : "bg-amber-500 opacity-60 group-hover:opacity-100"
                                            )} />

                                            <CardHeader className="p-8 pb-4">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className={cn(
                                                        "p-3 rounded-xl border transition-all",
                                                        invoice.status === 'PAID' ? "bg-eduGreen-950/20 border-eduGreen-900/30 text-eduGreen-500" : "bg-zinc-900 border-zinc-800 text-zinc-500"
                                                    )}>
                                                        {invoice.status === 'PAID' ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-2xl font-black text-white tracking-tighter">${parseFloat(invoice.amount).toLocaleString()}</div>
                                                        <div className={cn(
                                                            "text-[8px] font-black uppercase tracking-widest mt-1 px-2 py-0.5 rounded-full inline-block",
                                                            invoice.status === 'PAID' ? "bg-eduGreen-950 text-eduGreen-500" : "bg-amber-950 text-amber-500"
                                                        )}>
                                                            {invoice.status}
                                                        </div>
                                                    </div>
                                                </div>

                                                <h3 className="text-lg font-black text-white tracking-tight leading-none mb-4">Institutional Dues</h3>
                                                <div className="space-y-2">
                                                    {invoice.items.map((item: any, idx: number) => (
                                                        <div key={idx} className="flex justify-between items-center text-[10px] font-bold text-zinc-600">
                                                            <span className="uppercase tracking-widest">{item.name}</span>
                                                            <span className="text-zinc-500">${parseFloat(item.amount).toLocaleString()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="p-8 pt-0">
                                                <div className="pt-6 border-t border-zinc-900/50">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest">Due Date</p>
                                                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                                                            {new Date(invoice.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                        </p>
                                                    </div>

                                                    {invoice.status !== 'PAID' ? (
                                                        <Button className="w-full h-14 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                                                            Settle Outstanding
                                                        </Button>
                                                    ) : (
                                                        <Button variant="ghost" className="w-full h-14 bg-zinc-900/40 text-eduGreen-500 rounded-2xl font-black text-[10px] uppercase tracking-widest cursor-default">
                                                            Transaction Complete
                                                        </Button>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
