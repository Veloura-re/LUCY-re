"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, KeyRound, Mail, Lock, User, Check, AlertCircle, ArrowRight, Loader2, Sparkles } from "lucide-react";

export default function DirectorRegister() {
    const [step, setStep] = useState(1); // 1: Validate Key, 2: Register Details
    const [key, setKey] = useState("");
    const [schoolName, setSchoolName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const handleValidateKey = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch('/api/auth/validate-key', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key })
            });

            const data = await res.json();

            if (res.ok) {
                setSchoolName(data.schoolName);
                setEmail(data.email);
                setStep(2);
            } else {
                setError(data.error || "Invalid deployment key.");
            }
        } catch (err) {
            setError("Failed to validate key. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // 1. SignUp with Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: name,
                        role: 'PRINCIPAL'
                    }
                }
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Complete registration on server (burn token, link user)
                const res = await fetch('/api/dir/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: key,
                        userId: authData.user.id,
                        name,
                        email
                    })
                });

                if (res.ok) {
                    router.push('/dashboard');
                } else {
                    const data = await res.json();
                    throw new Error(data.error || "Failed to finalize registration.");
                }
            }
        } catch (err: any) {
            setError(err.message || "Registration failed.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans text-white relative overflow-hidden">
            {/* Immersive Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-eduGreen-500/10 blur-[140px] rounded-full" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-eduGreen-600/5 blur-[100px] rounded-full" />

                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <Card className="w-full max-w-md bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 shadow-2xl relative z-10 rounded-[2.5rem] overflow-hidden">
                <CardHeader className="text-center pb-2 pt-10">
                    <div className="mx-auto w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center mb-6 border border-zinc-900 shadow-2xl group">
                        {step === 1 ? (
                            <KeyRound className="w-7 h-7 text-eduGreen-500 animate-pulse" />
                        ) : (
                            <Building2 className="w-7 h-7 text-eduGreen-500" />
                        )}
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800/50 text-[10px] font-black text-eduGreen-500 uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-3.5 h-3.5 fill-eduGreen-500" />
                        <span>Institutional Access</span>
                    </div>

                    <CardTitle className="text-3xl font-black text-zinc-100 tracking-tighter">
                        {step === 1 ? "Deploy Institution" : "Finalize Setup"}
                    </CardTitle>
                    <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] mt-2">
                        {step === 1
                            ? "Enter your Master Deployment Key"
                            : `Environment: ${schoolName}`}
                    </CardDescription>
                </CardHeader>

                <CardContent className="px-10 pb-10 pt-6">
                    {step === 1 ? (
                        <form onSubmit={handleValidateKey} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Deployment Key</label>
                                <Input
                                    icon={<KeyRound className="w-4 h-4 text-eduGreen-500" />}
                                    value={key}
                                    onChange={e => setKey(e.target.value)}
                                    required
                                    placeholder="inv_xxxxxxxxxxxx"
                                    className="bg-zinc-900/30 border-zinc-800 text-eduGreen-400 placeholder:text-zinc-900 font-mono h-16 rounded-[1.25rem] focus:border-eduGreen-600 focus:bg-zinc-900/50 transition-all border-2"
                                />
                            </div>

                            {error && (
                                <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-2xl text-[10px] text-red-500 flex items-center gap-3 animate-in fade-in slide-in-from-top-2 font-black uppercase tracking-wider">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-16 rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 group border-t border-white/5"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                                    <>
                                        Verify Key
                                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </Button>
                        </form>
                    ) : (
                        <form onSubmit={handleRegister} className="space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Director Name</label>
                                    <Input
                                        icon={<User className="w-4 h-4 text-zinc-600" />}
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        required
                                        placeholder="Enter full name"
                                        className="bg-zinc-900/30 border-zinc-800 text-zinc-100 h-16 rounded-[1.25rem] focus:border-eduGreen-600 transition-all border-2"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Director Email</label>
                                    <Input
                                        type="email"
                                        icon={<Mail className="w-4 h-4 text-zinc-600" />}
                                        value={email}
                                        disabled
                                        className="bg-zinc-950/50 border-zinc-900 text-zinc-700 h-16 rounded-[1.25rem] cursor-not-allowed opacity-50 font-medium"
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Set Password</label>
                                    <Input
                                        type="password"
                                        icon={<Lock className="w-4 h-4 text-zinc-600" />}
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                        className="bg-zinc-900/30 border-zinc-800 text-zinc-100 h-16 rounded-[1.25rem] focus:border-eduGreen-600 transition-all border-2"
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-950/10 border border-red-900/20 rounded-2xl text-[10px] text-red-500 flex items-center gap-3 animate-in fade-in font-black uppercase tracking-wider">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <p>{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-16 rounded-[1.25rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 border-t border-white/5"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Complete Deployment"}
                            </Button>

                            <button
                                type="button"
                                onClick={() => setStep(1)}
                                className="w-full text-[9px] font-black text-zinc-800 uppercase tracking-[0.3em] hover:text-zinc-600 transition-colors py-2"
                            >
                                Use Different Key
                            </button>
                        </form>
                    )}
                </CardContent>

                <CardFooter className="justify-center border-t border-zinc-900 py-8 bg-zinc-950/20">
                    <Link href="/login" className="text-zinc-800 hover:text-zinc-500 text-[9px] font-black uppercase tracking-[0.4em] transition-all">
                        Return to Portal
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
