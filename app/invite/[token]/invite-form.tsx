"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CardContent } from "@/components/ui/card";
import { createClient } from "@/utils/supabase/client";
import { useRouter } from "next/navigation";
import { User, Lock, Mail, AlertCircle } from "lucide-react";

export function InviteForm({ token, email, schoolName, role }: { token: string, email: string, schoolName: string, role: string }) {
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        // 1. SignUp with Supabase
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                    role: role, // Dynamic role from invite
                }
            }
        });

        if (authError) {
            setError(authError.message);
            setIsLoading(false);
            return;
        }

        if (!authData.user) {
            setError("No user data returned.");
            setIsLoading(false);
            return;
        }

        // 2. Call API to link User, School, and Burn Token
        const res = await fetch('/api/dir/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                token,
                userId: authData.user.id,
                name,
                email
            })
        });

        if (!res.ok) {
            setError("Failed to complete registration on server.");
            setIsLoading(false);
            return;
        }

        router.push('/dashboard');
    };

    return (
        <CardContent className="pt-6">
            <form onSubmit={handleRegister} className="space-y-5">
                <Input
                    label="Email Address"
                    value={email}
                    disabled
                    icon={<Mail className="w-4 h-4 text-zinc-500" />}
                    className="bg-zinc-800/50 border-zinc-700 text-zinc-400"
                />
                <Input
                    label="Full Name"
                    placeholder="Dr. John Doe"
                    icon={<User className="w-4 h-4 text-zinc-500" />}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                    className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-eduGreen-600"
                />
                <Input
                    label="Set Password"
                    type="password"
                    placeholder="••••••••"
                    icon={<Lock className="w-4 h-4 text-zinc-500" />}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus:border-eduGreen-600"
                />

                {error && (
                    <div className="p-3 bg-red-900/20 border border-red-900/50 rounded text-sm text-red-400 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white py-6 text-base"
                    isLoading={isLoading}
                >
                    Complete Setup
                </Button>
            </form>
        </CardContent>
    );
}
