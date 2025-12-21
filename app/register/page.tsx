import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { User, School, Shield, ArrowRight, GraduationCap, Lock, Sparkles, Building2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-zinc-950 font-sans text-white py-12 px-4">
            {/* Immersive Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-eduGreen-500/10 blur-[140px] animate-pulse duration-[10s]" />
                <div className="absolute top-[20%] -right-[15%] w-[70%] h-[70%] rounded-full bg-emerald-500/15 blur-[120px] animate-pulse duration-[8s]" />
                <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[40%] rounded-full bg-eduGreen-600/10 blur-[100px]" />

                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            <div className="max-w-6xl w-full z-10 flex flex-col items-center gap-12 text-center">
                {/* Header Section */}
                <div className="space-y-4 animate-in fade-in slide-in-from-top-6 duration-1000">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/50 border border-zinc-800 backdrop-blur-md text-[10px] font-black text-eduGreen-500 uppercase tracking-[0.2em] shadow-2xl">
                        <Sparkles className="w-3.5 h-3.5 fill-eduGreen-500" />
                        <span>The Future starts here</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter text-white leading-[1.1]">
                        Join the <span className="text-transparent bg-clip-text bg-gradient-to-br from-eduGreen-400 via-eduGreen-500 to-emerald-600">LUCY</span> Ecosystem
                    </h1>

                    <p className="text-zinc-500 font-medium max-w-lg mx-auto text-sm md:text-base leading-relaxed">
                        A unified digital environment for modern education. Precision tracking, seamless communication, and role-specific empowerment.
                    </p>
                </div>

                {/* Choice Cards Grid - Updated to 5 items or optimized 4 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 w-full animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">

                    {/* Super Admin Card */}
                    <Link href="/register/admin" className="group relative h-full">
                        <div className="absolute -inset-0.5 bg-gradient-to-b from-eduGreen-500/40 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-700 blur-xl"></div>
                        <Card className="relative h-full bg-zinc-900/40 backdrop-blur-xl border-zinc-800/80 group-hover:border-eduGreen-500/50 transition-all duration-500 rounded-[2rem] overflow-hidden flex flex-col items-center text-center p-8">
                            <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-eduGreen-500/30 group-hover:bg-eduGreen-900/10 transition-all duration-500 mb-6 shadow-2xl">
                                <Shield className="h-7 w-7 text-eduGreen-400 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <CardTitle className="text-xl font-black text-white mb-2">Super Admin</CardTitle>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed flex-1">
                                System-wide governance and global institutional management. Restricted access.
                            </p>
                            <div className="mt-8 py-3 px-6 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-400 group-hover:text-eduGreen-400 group-hover:border-eduGreen-900/50 transition-all flex items-center gap-2 uppercase tracking-widest">
                                Initialize Access <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    </Link>

                    {/* School Official / Admin */}
                    <Link href="/register/director" className="group relative h-full">
                        <div className="absolute -inset-0.5 bg-gradient-to-b from-eduGreen-500/40 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-700 blur-xl"></div>
                        <Card className="relative h-full bg-zinc-900/40 backdrop-blur-xl border-zinc-800/80 group-hover:border-eduGreen-500/50 transition-all duration-500 rounded-[2rem] overflow-hidden flex flex-col items-center text-center p-8">
                            <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-eduGreen-500/30 group-hover:bg-eduGreen-900/10 transition-all duration-500 mb-6 shadow-2xl">
                                <Building2 className="h-7 w-7 text-eduGreen-400 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <CardTitle className="text-xl font-black text-white mb-2">School Director</CardTitle>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed flex-1">
                                Complete institutional management. Deploy LUCY for your entire school infrastructure.
                            </p>
                            <div className="mt-8 py-3 px-6 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-400 group-hover:text-eduGreen-400 group-hover:border-eduGreen-900/50 transition-all flex items-center gap-2 uppercase tracking-widest">
                                Deploy Institutional <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    </Link>

                    {/* Parent Card */}
                    <Link href="/register/parent" className="group relative h-full">
                        <div className="absolute -inset-0.5 bg-gradient-to-b from-eduGreen-500/40 to-transparent rounded-[2rem] opacity-0 group-hover:opacity-100 transition duration-700 blur-xl"></div>
                        <Card className="relative h-full bg-zinc-900/40 backdrop-blur-xl border-zinc-800/80 group-hover:border-eduGreen-500/50 transition-all duration-500 rounded-[2rem] overflow-hidden flex flex-col items-center text-center p-8">
                            <div className="w-16 h-16 bg-zinc-950 rounded-2xl flex items-center justify-center border border-zinc-800 group-hover:border-eduGreen-500/30 group-hover:bg-eduGreen-900/10 transition-all duration-500 mb-6 shadow-2xl">
                                <User className="h-7 w-7 text-eduGreen-400 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <CardTitle className="text-xl font-black text-white mb-2">Parent Portal</CardTitle>
                            <p className="text-xs text-zinc-500 font-medium leading-relaxed flex-1">
                                Monitor academic growth, attendance patterns, and direct school connectivity in real-time.
                            </p>
                            <div className="mt-8 py-3 px-6 rounded-full bg-zinc-950 border border-zinc-800 text-[10px] font-bold text-zinc-400 group-hover:text-eduGreen-400 group-hover:border-eduGreen-900/50 transition-all flex items-center gap-2 uppercase tracking-widest">
                                Link Account <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </Card>
                    </Link>

                    {/* Teachers/Staff (Disabled/Info State) */}
                    <div className="relative h-full group opacity-80">
                        <Card className="relative h-full bg-zinc-950/20 backdrop-blur-sm border-zinc-900 border-dashed border-2 rounded-[2rem] overflow-hidden flex flex-col items-center text-center p-8">
                            <div className="w-16 h-16 bg-zinc-900/50 rounded-2xl flex items-center justify-center border border-zinc-900 mb-6 grayscale opacity-40">
                                <School className="h-7 w-7 text-zinc-500" />
                            </div>
                            <CardTitle className="text-xl font-black text-zinc-700 mb-2">Staff & Faculty</CardTitle>
                            <p className="text-xs text-zinc-700 font-medium leading-relaxed flex-1">
                                Secure access for educators and administrative staff. Requires authorized school invitation.
                            </p>
                            <div className="mt-8 py-3 px-6 rounded-full bg-zinc-900/30 border border-zinc-900 text-[10px] font-bold text-zinc-600 uppercase tracking-widest">
                                Invitation Only
                            </div>
                        </Card>
                    </div>

                </div>

                {/* Footer Section */}
                <div className="flex flex-col items-center gap-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-500">
                    <p className="text-xs text-zinc-600 font-medium">
                        Already have an active workspace? <Link href="/login" className="text-eduGreen-500 font-black hover:text-eduGreen-400 transition-colors">Log in here</Link>
                    </p>

                    <div className="flex items-center gap-8 py-6 px-10 rounded-full border border-zinc-900 bg-zinc-950/40 text-[9px] font-black text-zinc-700 tracking-[0.3em] uppercase">
                        <div className="flex items-center gap-2"><Lock className="w-3 h-3 text-eduGreen-900" /> Privacy First</div>
                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                        <div className="flex items-center gap-2"><GraduationCap className="w-3 h-3 text-eduGreen-900" /> Academic Precision</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
