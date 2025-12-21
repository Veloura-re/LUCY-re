"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldAlert, KeyRound, Mail, Lock, User, Check, AlertCircle } from "lucide-react";

export default function AdminRegister() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [secretKey, setSecretKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // 1. Verify Secret Key with API BEFORE creating Auth user to prevent spam
        // Actually, we can do it in parallel or just handle cleanup. 
        // Let's create Auth user first, then sync. If sync fails (bad key), we delete auth user? 
        // Better: Allow anyone to be 'created' in Auth, but only give SUPERADMIN role in DB if key matches.

        // Step 1: SignUp
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { full_name: name, role: 'SUPERADMIN' } // This metadata is insecure for RLS, strictly for UI
            }
        });

        if (authError) {
            setError(authError.message);
            setIsLoading(false);
            return;
        }

        if (authData.user) {
            // Step 2: Validate Key and Create DB Record
            const res = await fetch('/api/auth/register-admin', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: authData.user.id,
                    email,
                    name,
                    secretKey
                })
            });

            const data = await res.json();

            if (res.ok) {
                router.push('/admin/dashboard');
            } else {
                setError(data.error || "Registration failed.");
                // Optional: Delete supabase user if DB failed? 
                // For now, let's just leave it. They can't do anything without DB record.
            }
        }
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 font-sans text-white">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-eduGreen-500/20 blur-[120px] rounded-full" />
            </div>

            <Card className="w-full max-w-md bg-zinc-900/90 border-zinc-800 shadow-2xl relative z-10">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center mb-4 border border-zinc-700">
                        <ShieldAlert className="w-6 h-6 text-eduGreen-500" />
                    </div>
                    <CardTitle className="text-2xl font-bold text-white">Super Admin Access</CardTitle>
                    <CardDescription className="text-zinc-400">
                        Restricted registration. Requires Master Key.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div className="space-y-4">
                            <Input
                                label="Admin Name"
                                icon={<User className="w-4 h-4 text-zinc-500" />}
                                value={name}
                                onChange={e => setName(e.target.value)}
                                required
                                placeholder="System Administrator"
                                className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-eduGreen-600"
                            />
                            <Input
                                label="Email"
                                type="email"
                                icon={<Mail className="w-4 h-4 text-zinc-500" />}
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                required
                                placeholder="admin@lucy.edu"
                                className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-eduGreen-600"
                            />
                            <Input
                                label="Password"
                                type="password"
                                icon={<Lock className="w-4 h-4 text-zinc-500" />}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-eduGreen-600"
                            />
                            <div className="pt-2">
                                <Input
                                    label="Master Secret Key"
                                    type="password"
                                    icon={<KeyRound className="w-4 h-4 text-eduGreen-500" />}
                                    value={secretKey}
                                    onChange={e => setSecretKey(e.target.value)}
                                    required
                                    placeholder="ENTER_SECRET_KEY"
                                    className="bg-eduGreen-950/20 border-eduGreen-900/50 text-eduGreen-200 placeholder:text-eduGreen-800/50 focus:border-eduGreen-500"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-sm text-red-400 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4" /> {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white py-6 mt-2" isLoading={isLoading}>
                            Initialize Admin Account
                        </Button>
                    </form>
                </CardContent>
                <CardFooter className="justify-center border-t border-zinc-800 py-4">
                    <Link href="/login" className="text-zinc-500 hover:text-white text-sm transition-colors">
                        Return to Login
                    </Link>
                </CardFooter>
            </Card>
        </div>
    );
}
