"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ArrowRight, ShieldCheck, KeyRound, Mail, Lock } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export default function StudentRegisterPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [step, setStep] = useState(1); // 1: Code, 2: Details

    const [formData, setFormData] = useState({
        studentCode: "",
        email: "",
        password: "",
        confirmPassword: ""
    });

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Security Keyphrase mismatch");
            return;
        }

        setIsLoading(true);

        try {
            const res = await fetch("/api/auth/register/student", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    studentCode: formData.studentCode,
                    email: formData.email,
                    password: formData.password
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Registration failed");
            }

            toast.success("Identity Verified. Access Granted.");
            router.push("/login?role=student");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-900/20 via-black to-black" />
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-eduGreen-500/50 to-transparent opacity-50" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-lg relative z-10"
            >
                {/* Logo Section */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-eduGreen-900/20 rounded-2xl border border-eduGreen-500/30 flex items-center justify-center mx-auto mb-4 backdrop-blur-xl shadow-[0_0_40px_rgba(20,184,115,0.1)]">
                        <ShieldCheck className="w-8 h-8 text-eduGreen-500" />
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Student Portal</h1>
                    <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs mt-2">Secure Institutional Access</p>
                </div>

                <Card className="bg-zinc-950/50 backdrop-blur-xl border-zinc-900 shadow-2xl overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-eduGreen-600 to-eduGreen-400" />

                    <CardHeader className="p-8 border-b border-zinc-900/50">
                        <CardTitle className="text-xl font-black text-white uppercase tracking-wide">
                            Activation Protocol
                        </CardTitle>
                        <CardDescription className="text-zinc-600 font-bold text-xs uppercase tracking-widest mt-1">
                            Enter your credentials to initialize your workspace
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="p-8">
                        <form onSubmit={handleRegister} className="space-y-6">
                            <AnimatePresence mode="wait">
                                {step === 1 ? (
                                    <motion.div
                                        key="step1"
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Student Invite Token</Label>
                                            <div className="relative group">
                                                <KeyRound className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-eduGreen-500 transition-colors" />
                                                <Input
                                                    value={formData.studentCode}
                                                    onChange={(e) => setFormData({ ...formData, studentCode: e.target.value.toUpperCase() })}
                                                    placeholder="STU-XXXX-XXXX"
                                                    className="pl-12 h-14 bg-zinc-900/50 border-zinc-800 text-white font-mono font-bold text-lg tracking-widest uppercase focus:border-eduGreen-500 focus:ring-eduGreen-500/20 rounded-xl transition-all"
                                                    required
                                                />
                                            </div>
                                            <p className="text-[10px] text-zinc-600 font-medium px-1">
                                                * This unique code was issued by your school administration.
                                            </p>
                                        </div>

                                        <Button
                                            type="button"
                                            onClick={() => {
                                                if (formData.studentCode.length < 5) {
                                                    toast.error("Invalid Token Format");
                                                    return;
                                                }
                                                setStep(2);
                                            }}
                                            className="w-full h-14 bg-white text-black hover:bg-zinc-200 font-black uppercase tracking-widest rounded-xl transition-all active:scale-[0.98]"
                                        >
                                            Verify Token <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key="step2"
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        className="space-y-6"
                                    >
                                        <div className="space-y-3">
                                            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Secure Email Uplink</Label>
                                            <div className="relative group">
                                                <Mail className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-eduGreen-500 transition-colors" />
                                                <Input
                                                    type="email"
                                                    value={formData.email}
                                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                    placeholder="student@school.edu"
                                                    className="pl-12 h-14 bg-zinc-900/50 border-zinc-800 text-white font-medium focus:border-eduGreen-500 focus:ring-eduGreen-500/20 rounded-xl transition-all"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Access Keyphrase</Label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-eduGreen-500 transition-colors" />
                                                    <Input
                                                        type="password"
                                                        value={formData.password}
                                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="pl-12 h-14 bg-zinc-900/50 border-zinc-800 text-white font-medium focus:border-eduGreen-500 focus:ring-eduGreen-500/20 rounded-xl transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">Confirm Keyphrase</Label>
                                                <div className="relative group">
                                                    <Lock className="absolute left-4 top-4 w-5 h-5 text-zinc-600 group-focus-within:text-eduGreen-500 transition-colors" />
                                                    <Input
                                                        type="password"
                                                        value={formData.confirmPassword}
                                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                                        placeholder="••••••••"
                                                        className="pl-12 h-14 bg-zinc-900/50 border-zinc-800 text-white font-medium focus:border-eduGreen-500 focus:ring-eduGreen-500/20 rounded-xl transition-all"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-3">
                                            <Button
                                                type="button"
                                                onClick={() => setStep(1)}
                                                variant="ghost"
                                                className="h-14 px-6 text-zinc-500 hover:text-white font-black uppercase tracking-widest rounded-xl"
                                            >
                                                Back
                                            </Button>
                                            <Button
                                                type="submit"
                                                disabled={isLoading}
                                                className="flex-1 h-14 bg-eduGreen-600 hover:bg-eduGreen-500 text-white font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-eduGreen-900/20"
                                            >
                                                {isLoading ? (
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                ) : (
                                                    "Activate Account"
                                                )}
                                            </Button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </form>
                    </CardContent>

                    <div className="p-6 border-t border-zinc-900/50 bg-black/20 text-center">
                        <Link href="/login" className="text-xs font-bold uppercase tracking-widest text-zinc-600 hover:text-eduGreen-500 transition-colors">
                            Already activated? Secure Login →
                        </Link>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
}
