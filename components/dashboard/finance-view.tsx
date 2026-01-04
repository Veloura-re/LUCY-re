"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    CreditCard,
    Plus,
    Trash2,
    DollarSign,
    Calculator,
    Briefcase,
    Settings2,
    ArrowRight,
    Search,
    Filter,
    Zap,
    CalendarDays
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { SpringingLoader } from "@/components/dashboard/springing-loader";
import { toast } from "sonner";
import { ConfirmationModal, InputModal } from "@/components/ui/confirmation-modal";

interface FinanceViewProps {
    user: any;
    school: any;
    grades: any[];
}

export function FinanceView({ user, school, grades }: FinanceViewProps) {
    const [fees, setFees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [financialAnalytics, setFinancialAnalytics] = useState<any>(null);
    const [invoices, setInvoices] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        amount: "",
        category: "TUITION",
        frequency: "TERM",
        gradeId: "ALL",
        description: ""
    });

    useEffect(() => {
        fetchFees();
        fetchFinancialAnalytics();
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const res = await fetch('/api/school/finance/invoices');
            const data = await res.json();
            setInvoices(data);
        } catch (e) {
            console.error("Invoice synchronizer failed:", e);
        }
    };

    const fetchFinancialAnalytics = async () => {
        try {
            const res = await fetch('/api/school/finance/analytics');
            const data = await res.json();
            setFinancialAnalytics(data);
        } catch (e) {
            console.error("Finance analytics uplink failed:", e);
        }
    };

    const fetchFees = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/school/finance/fees');
            const data = await res.json();
            setFees(data);
        } catch (e) {
            console.error(e);
            toast.error("Failed to synchronize financial data");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/school/finance/fees', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    gradeId: formData.gradeId === "ALL" ? null : formData.gradeId
                })
            });
            if (!res.ok) throw new Error("Failed to create fee");
            toast.success("Fee structure established");
            setIsCreating(false);
            setFormData({ name: "", amount: "", category: "TUITION", frequency: "TERM", gradeId: "ALL", description: "" });
            fetchFees();
        } catch (e) {
            toast.error("Institutional protocol failure");
        }
    };

    const handleDeleteFee = (id: string) => {
        setDeleteId(id);
    };

    const executeDeleteFee = async () => {
        if (!deleteId) return;
        try {
            const res = await fetch(`/api/school/finance/fees/${deleteId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error("Failed to delete");
            toast.success("Structure decommissioned");
            fetchFees();
        } catch (e) {
            toast.error("Failed to delete fee structure");
        } finally {
            setDeleteId(null);
        }
    };

    const handleGenerateInvoices = async (dueDate: string) => {
        setShowInvoiceModal(false);
        setIsGenerating(true);
        try {
            const res = await fetch('/api/school/finance/invoices/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ dueDate, term: "Term 1 2024" })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message || "Failed to generate");
            toast.success(data.message);
        } catch (e: any) {
            toast.error(e.message || "Institutional protocol failure");
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <SpringingLoader message="Retrieving Institutional Ledger" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-1000 relative z-10 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-900 pb-10">
                <div>
                    <h1 className="text-5xl font-black tracking-tighter text-white uppercase italic">
                        Financial <span className="text-eduGreen-500 not-italic">Nexus</span>
                    </h1>
                    <p className="text-zinc-600 font-bold uppercase tracking-[0.2em] text-xs mt-3">Autonomous Resource Controller & Billing Terminal</p>
                </div>

                <div className="flex items-center gap-4 mb-1">
                    <Button
                        variant="ghost"
                        onClick={() => setShowInvoiceModal(true)}
                        disabled={isGenerating}
                        className="rounded-2xl border border-zinc-900 bg-zinc-950/50 hover:border-eduGreen-500/30 transition-all h-14 px-6 font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white"
                    >
                        <Zap className={cn("mr-2 h-4 w-4 text-amber-500", isGenerating && "animate-pulse")} />
                        {isGenerating ? "Executing Cycle..." : "Launch Invoicing Cycle"}
                    </Button>
                    {!isCreating && (
                        <Button
                            onClick={() => setIsCreating(true)}
                            className="bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-14 px-8 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 shadow-eduGreen-900/20"
                        >
                            <Plus className="mr-2 h-4 w-4" /> Create Structure
                        </Button>
                    )}
                </div>
            </div>

            {/* Financial Intelligence Dashboard */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Revenue Trend Graph */}
                <Card className="lg:col-span-8 bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden shadow-2xl border-t-zinc-800/20">
                    <CardHeader className="p-10 pb-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-2xl font-black text-white uppercase italic">Revenue <span className="text-eduGreen-500 not-italic">Temporal Shift</span></CardTitle>
                                <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] mt-1">12-Month Liquidity Flux</p>
                            </div>
                            <div className="px-3 py-1 bg-eduGreen-500/10 border border-eduGreen-500/20 rounded-lg">
                                <span className="text-[10px] font-black text-eduGreen-500 uppercase tracking-widest italic">Live Delta</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10 pt-8">
                        <RevenueFluxChart data={financialAnalytics?.trends} />
                    </CardContent>
                </Card>

                {/* Efficiency & Liquidity */}
                <div className="lg:col-span-4 space-y-8">
                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] p-8 shadow-2xl border-t-zinc-800/20 group hover:border-eduGreen-900/30 transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Efficiency Index</span>
                            <Zap className="w-4 h-4 text-eduGreen-500" />
                        </div>
                        <div className="flex items-end justify-between">
                            <div>
                                <div className="text-5xl font-black text-white tracking-tighter">{financialAnalytics?.summary?.efficiency || 0}%</div>
                                <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mt-2 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-eduGreen-500 animate-pulse" />
                                    Collection Yield
                                </div>
                            </div>
                            <div className="h-16 w-16 relative">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-zinc-900" />
                                    <motion.circle
                                        cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                                        strokeDasharray="175.9"
                                        initial={{ strokeDashoffset: 175.9 }}
                                        animate={{ strokeDashoffset: 175.9 - (Math.min(parseFloat(financialAnalytics?.summary?.efficiency || 0), 100) / 100) * 175.9 }}
                                        transition={{ duration: 1.5, ease: "easeOut" }}
                                        strokeLinecap="round"
                                        className="text-eduGreen-500 drop-shadow-[0_0_8px_rgba(20,184,115,0.4)]"
                                    />
                                </svg>
                            </div>
                        </div>
                    </Card>

                    <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] p-8 shadow-2xl border-t-zinc-800/20 group hover:border-amber-900/30 transition-all">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Pending Liquidity</span>
                            <DollarSign className="w-4 h-4 text-amber-500" />
                        </div>
                        <div className="text-4xl font-black text-white tracking-tighter italic">
                            ${(financialAnalytics?.summary?.totalPending || 0).toLocaleString()}
                        </div>
                        <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mt-3">Uncollected Institutional Assets</p>
                        <div className="mt-6 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: "60%" }}
                                className="h-full bg-amber-500/50"
                            />
                        </div>
                    </Card>
                </div>
            </div>

            {isCreating && (
                <Card className="bg-zinc-950/40 backdrop-blur-xl border-zinc-900 animate-in slide-in-from-top-4 duration-500 rounded-[2.5rem] overflow-hidden">
                    <CardHeader className="p-10 border-b border-zinc-900/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-eduGreen-950/20 rounded-xl border border-eduGreen-900/30 text-eduGreen-500">
                                    <Settings2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <CardTitle className="text-2xl font-black text-white tracking-tight">Fee Configuration</CardTitle>
                                    <CardDescription className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mt-1">Establishing new billing protocol</CardDescription>
                                </div>
                            </div>
                            <Button variant="ghost" onClick={() => setIsCreating(false)} className="text-zinc-600 hover:text-white font-black text-[10px] uppercase tracking-widest">
                                Cancel
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-10">
                        <form onSubmit={handleCreateFee} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Structure Name</label>
                                    <Input
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Annual Tuition Fee"
                                        className="h-14 bg-zinc-900/50 border-zinc-800 rounded-xl focus:border-eduGreen-500 transition-all font-bold"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Target Grade</label>
                                    <select
                                        value={formData.gradeId}
                                        onChange={e => setFormData({ ...formData, gradeId: e.target.value })}
                                        className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 text-white font-bold text-sm focus:border-eduGreen-500 outline-none appearance-none"
                                    >
                                        <option value="ALL">Institutional Universal (All Grades)</option>
                                        {grades.map(grade => (
                                            <option key={grade.id} value={grade.id}>Grade {grade.level} - {grade.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quantum (Amount)</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-eduGreen-500" />
                                        <Input
                                            required
                                            type="number"
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                            className="h-14 pl-12 bg-zinc-900/50 border-zinc-800 rounded-xl focus:border-eduGreen-500 transition-all font-black text-xl text-white"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Cycle</label>
                                        <select
                                            value={formData.frequency}
                                            onChange={e => setFormData({ ...formData, frequency: e.target.value })}
                                            className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 text-white font-bold text-sm focus:border-eduGreen-500 outline-none"
                                        >
                                            <option value="TERM">Per Term</option>
                                            <option value="MONTHLY">Monthly</option>
                                            <option value="ANNUAL">Annual</option>
                                            <option value="ONCE">Single Event</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Classification</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full h-14 bg-zinc-900/50 border border-zinc-800 rounded-xl px-4 text-white font-bold text-sm focus:border-eduGreen-500 outline-none"
                                        >
                                            <option value="TUITION">Tuition</option>
                                            <option value="TRANSPORT">Transport</option>
                                            <option value="SPORTS">Sports</option>
                                            <option value="LIBRARY">Library</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <Button type="submit" className="w-full h-16 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black text-sm uppercase tracking-[0.3em] transition-all">
                                    Authorize Fee Structure
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Institutional Invoice Ledger */}
            <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Institutional Ledger</h2>
                            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mt-0.5">Automated Reconciliation Registry</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                            <Input
                                placeholder="Search Scholar..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="h-12 w-64 pl-12 bg-zinc-950 border-zinc-900 rounded-xl focus:border-eduGreen-500 transition-all font-bold text-xs"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                            className="h-12 bg-zinc-950 border border-zinc-900 rounded-xl px-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest focus:border-eduGreen-500 outline-none hover:border-zinc-800 transition-all appearance-none cursor-pointer"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="PAID">Confirmed</option>
                            <option value="PENDING">Pending</option>
                            <option value="OVERDUE">Overdue</option>
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    {invoices.filter(inv => {
                        const name = `${inv.student.firstName} ${inv.student.lastName}`.toLowerCase();
                        const matchesSearch = name.includes(searchQuery.toLowerCase());
                        const matchesFilter = statusFilter === 'ALL' || inv.status === statusFilter;
                        return matchesSearch && matchesFilter;
                    }).map((inv, i) => (
                        <Card key={inv.id} className="bg-zinc-950/20 border-zinc-900/50 rounded-3xl p-6 hover:border-zinc-800 transition-all group overflow-hidden relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-eduGreen-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                                <div className="flex items-center gap-6">
                                    <div className="w-12 h-12 rounded-2xl bg-zinc-900 flex items-center justify-center border border-zinc-800 font-black text-zinc-600 group-hover:text-eduGreen-500 transition-colors">
                                        {inv.student.firstName[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-black text-white uppercase tracking-tight">{inv.student.firstName} {inv.student.lastName}</div>
                                        <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-0.5">{inv.student.studentCode}</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 md:flex items-center gap-12">
                                    <div>
                                        <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Due Date</div>
                                        <div className="text-[11px] font-black text-zinc-400">{new Date(inv.dueDate).toLocaleDateString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Quantum</div>
                                        <div className="text-[11px] font-black text-white">${parseFloat(inv.amount).toLocaleString()}</div>
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black text-zinc-700 uppercase tracking-widest mb-1">Status</div>
                                        <div className={cn(
                                            "text-[9px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-lg border inline-block italic",
                                            inv.status === 'PAID' ? "bg-eduGreen-500/10 border-eduGreen-500/20 text-eduGreen-500" :
                                                inv.status === 'OVERDUE' ? "bg-red-500/10 border-red-500/20 text-red-500" :
                                                    "bg-amber-500/10 border-amber-500/20 text-amber-500"
                                        )}>
                                            {inv.status}
                                        </div>
                                    </div>
                                    {inv.status !== 'PAID' && (
                                        <Button
                                            size="sm"
                                            onClick={async () => {
                                                const res = await fetch('/api/school/finance/webhooks', {
                                                    method: 'POST',
                                                    body: JSON.stringify({
                                                        invoiceId: inv.id,
                                                        status: 'SUCCESS',
                                                        transactionReference: `SIM_AUTO_${Math.random().toString(36).slice(2, 6).toUpperCase()}`
                                                    })
                                                });
                                                if (res.ok) {
                                                    toast.success("Zero-Click Confirmation Executed");
                                                    fetchInvoices();
                                                    fetchFinancialAnalytics();
                                                }
                                            }}
                                            className="h-10 px-4 bg-zinc-900 hover:bg-eduGreen-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                                        >
                                            Simulate Pay
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fees.map((fee) => (
                    <Card key={fee.id} className="group relative bg-zinc-950/40 backdrop-blur-xl border-zinc-900/50 rounded-[2.5rem] overflow-hidden hover:border-eduGreen-900/30 transition-all border-t-zinc-800/10 shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-eduGreen-600 via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="p-8 pb-4">
                            <div className="flex justify-between items-start">
                                <div className="p-3 bg-zinc-900/50 rounded-xl border border-zinc-800 text-eduGreen-500 group-hover:border-eduGreen-900/30 transition-all">
                                    <Calculator className="w-5 h-5" />
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-black text-white tracking-tighter">
                                        ${parseFloat(fee.amount).toLocaleString()}
                                    </div>
                                    <div className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mt-1">
                                        {fee.frequency} Quantum
                                    </div>
                                </div>
                            </div>
                            <CardTitle className="text-xl font-black text-white mt-6 tracking-tight group-hover:text-eduGreen-500 transition-colors">
                                {fee.name}
                            </CardTitle>
                            <div className="flex items-center gap-3 mt-2">
                                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-2 py-1 bg-zinc-900 rounded-lg border border-zinc-800 group-hover:border-eduGreen-900/20 transition-all">
                                    {fee.category}
                                </span>
                                <span className="text-[9px] font-black text-eduGreen-900 uppercase tracking-tighter">
                                    {fee.grade ? `Target: Grade ${fee.grade.level}` : "Universal Directive"}
                                </span>
                            </div>
                        </CardHeader>
                        <CardFooter className="px-8 pb-8 pt-6 flex justify-between items-center bg-zinc-900/20">
                            <span className="text-[8px] font-bold text-zinc-700 uppercase tracking-widest">
                                ID: {fee.id.slice(0, 8)}...
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteFee(fee.id)}
                                className="h-10 px-4 text-zinc-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Decommission
                            </Button>
                        </CardFooter>
                    </Card>
                ))}

                {fees.length === 0 && !isCreating && (
                    <div className="md:col-span-2 py-32 text-center">
                        <div className="w-20 h-20 bg-zinc-950 rounded-full flex items-center justify-center border border-zinc-900 mx-auto mb-6 opacity-30">
                            <CreditCard className="w-10 h-10 text-zinc-500" />
                        </div>
                        <p className="text-zinc-600 font-black uppercase tracking-[0.4em] text-xs">No Fee Protocols Active</p>
                        <Button variant="ghost" onClick={() => setIsCreating(true)} className="text-eduGreen-500 mt-4 font-black uppercase tracking-widest text-[10px]">
                            Establish Initial Structure
                        </Button>
                    </div>
                )}
            </div>

            <ConfirmationModal
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={executeDeleteFee}
                title="Decommission Structure"
                description="This action will permanently remove this fee structure from the institutional ledger. All associated billing records will be archived."
                confirmText="Decommission"
                variant="danger"
            />

            <InputModal
                isOpen={showInvoiceModal}
                onClose={() => setShowInvoiceModal(false)}
                onConfirm={handleGenerateInvoices}
                title="Launch Invoicing Cycle"
                description="Specify the financial period deadline for generated invoices."
                placeholder="YYYY-MM-DD"
                defaultValue="2024-01-31"
                inputType="date"
                confirmText="Execute Cycle"
            />
        </div>
    );
}

function RevenueFluxChart({ data }: { data: any }) {
    if (!data) return <div className="h-64 flex items-center justify-center text-[10px] font-black text-zinc-800 uppercase tracking-widest">Initializing Neural Stream...</div>;

    const maxVal = Math.max(...data.datasets[0].data, ...data.datasets[1].data, 1000);

    return (
        <div className="relative h-64 w-full group pt-4">
            <div className="absolute inset-0 flex items-end justify-between gap-4 px-2">
                {data.labels.map((label: string, i: number) => {
                    const revHeight = (data.datasets[0].data[i] / maxVal) * 100;
                    const penHeight = (data.datasets[1].data[i] / maxVal) * 100;

                    return (
                        <div key={i} className="flex-1 flex flex-col justify-end gap-1 group/bar relative">
                            {/* Pending Bar */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${penHeight}%` }}
                                transition={{ duration: 1, delay: i * 0.05 }}
                                className="w-full bg-zinc-900/80 rounded-t-sm border-x border-t border-zinc-800 group-hover/bar:bg-zinc-800 transition-colors"
                            />
                            {/* Revenue Bar */}
                            <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${revHeight}%` }}
                                transition={{ duration: 1, delay: i * 0.05 + 0.2 }}
                                className="w-full bg-gradient-to-t from-eduGreen-600 to-eduGreen-400 rounded-t-sm shadow-[0_0_15px_rgba(20,184,115,0.2)]"
                            />

                            {/* Tooltip on hover */}
                            <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white text-black text-[8px] font-black px-2 py-1 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none uppercase tracking-tighter">
                                Rev: ${data.datasets[0].data[i].toLocaleString()}
                            </div>

                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[8px] font-black text-zinc-700 uppercase tracking-tighter">
                                {label}
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
