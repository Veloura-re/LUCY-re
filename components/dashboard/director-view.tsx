"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, BarChart3, Users, GraduationCap, BookOpen, Calendar, DollarSign, Settings, Bell, Search, Sparkles, School, Clock, MessageSquare, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UpcomingEventsWidget } from "./upcoming-events";

export function DirectorView({ user, school: initialSchool }: { user: any, school: any }) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    // School Creation State
    const [schoolName, setSchoolName] = useState("");
    const [schoolCode, setSchoolCode] = useState("");
    const [institutionalMetrics, setInstitutionalMetrics] = useState({
        avgAttendance: "...",
        examCompletion: "...",
        recentEvents: 0
    });

    useEffect(() => {
        if (initialSchool) {
            fetch('/api/school/analytics')
                .then(res => res.json())
                .then(data => {
                    if (data.summary) {
                        setInstitutionalMetrics(prev => ({
                            ...prev,
                            avgAttendance: data.summary.avgAttendance,
                            examCompletion: data.summary.examCompletion,
                            recentEvents: data.summary.recentEvents
                        }));
                    }
                })
                .catch(err => console.error("Pulse fetch error:", err));
        }
    }, [initialSchool]);

    const handleCreateSchool = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch('/api/admin/schools', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: schoolName,
                    schoolCode: schoolCode,
                    domain: "" // Optional
                })
            });

            if (res.ok) {
                router.refresh(); // Reload to show the dashboard
            } else {
                alert("Failed to create school. School Code might be taken.");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // --- ONBOARDING VIEW (No School Linked) ---
    if (!initialSchool) {
        return (
            <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-in fade-in duration-700 relative">
                <div className="text-center space-y-6 mb-12 max-w-2xl relative z-10">
                    <div className="mx-auto w-20 h-20 bg-zinc-950 rounded-[2rem] flex items-center justify-center mb-8 border border-zinc-900 shadow-2xl group transition-all hover:scale-110">
                        <Sparkles className="w-10 h-10 text-eduGreen-500 animate-pulse" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-[0.2em] mb-4">
                        <Sparkles className="w-3.5 h-3.5 fill-eduGreen-500" />
                        <span>Account Verified</span>
                    </div>

                    <h1 className="text-5xl font-black tracking-tighter text-white">Welcome, Director {user.name}</h1>
                    <p className="text-zinc-500 text-lg font-medium leading-relaxed">
                        Your account is ready. To begin, please register your school organization to deploy your digital academic infrastructure.
                    </p>
                </div>

                <Card className="w-full max-w-xl bg-zinc-950/50 backdrop-blur-2xl border-zinc-900 shadow-2xl relative z-10 rounded-[3rem] overflow-hidden border-t-zinc-800/50">
                    <CardHeader className="text-center pt-12 pb-8 px-12">
                        <CardTitle className="text-2xl font-black text-white tracking-tight">Deploy Organization</CardTitle>
                        <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[10px] mt-2">Create your school's workspace</CardDescription>
                    </CardHeader>
                    <CardContent className="px-12 pb-12">
                        <form onSubmit={handleCreateSchool} className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">School Name</label>
                                <Input
                                    placeholder="e.g. Springfield Academy"
                                    value={schoolName}
                                    onChange={e => setSchoolName(e.target.value)}
                                    required
                                    icon={<School className="w-4 h-4 text-eduGreen-500" />}
                                    className="bg-zinc-900/30 border-zinc-800 text-white h-16 rounded-[1.5rem] focus:border-eduGreen-600 transition-all border-2"
                                />
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] ml-2">Internal School Code</label>
                                <Input
                                    placeholder="e.g. SPRINGFIELD-001"
                                    value={schoolCode}
                                    onChange={e => setSchoolCode(e.target.value.toUpperCase())}
                                    required
                                    icon={<BookOpen className="w-4 h-4 text-eduGreen-500" />}
                                    className="font-mono uppercase bg-zinc-900/30 border-zinc-800 text-eduGreen-400 h-16 rounded-[1.5rem] focus:border-eduGreen-600 transition-all border-2 tracking-widest"
                                />
                            </div>

                            <Button
                                className="w-full bg-eduGreen-600 hover:bg-eduGreen-500 text-white h-16 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-eduGreen-900/20 mt-4"
                                isLoading={isLoading}
                            >
                                Launch Workspace <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>
                        </form>
                    </CardContent>
                    <CardFooter className="bg-zinc-950/80 border-t border-zinc-900/50 p-6 text-[9px] text-center text-zinc-700 font-black uppercase tracking-[0.3em] justify-center">
                        This code will link all your students and teachers.
                    </CardFooter>
                </Card>
            </div>
        );
    }

    // --- DASHBOARD VIEW ---
    const stats = [
        { label: "Total Students", value: initialSchool?._count?.students || 0, icon: GraduationCap, color: "text-eduGreen-500", desc: "Active Learners" },
        { label: "Total Staff", value: initialSchool?._count?.users || 1, icon: Users, color: "text-emerald-500", desc: "Academic Team" },
        { label: "Active Classes", value: initialSchool?._count?.grades || 0, icon: BookOpen, color: "text-eduGreen-400", desc: "Digital Rooms" },
        { label: "Recent Events", value: initialSchool?._count?.events || 0, icon: Calendar, color: "text-emerald-400", desc: "School Timeline" },
    ];

    return (
        <div className="space-y-10 animate-in fade-in duration-700 relative z-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-eduGreen-950/20 border border-eduGreen-900/30 text-[10px] font-black text-eduGreen-500 uppercase tracking-widest mb-4">
                        <Sparkles className="w-3 h-3 fill-eduGreen-500" />
                        <span>Command Center</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tight">Director Dashboard</h1>
                    <div className="flex items-center gap-3 text-zinc-500 mt-2 font-bold text-sm">
                        <School className="w-4 h-4 text-eduGreen-500" />
                        <span>{initialSchool.name}</span>
                        <div className="w-1 h-1 rounded-full bg-zinc-800" />
                        <span className="font-mono text-[10px] tracking-widest uppercase opacity-60">ID: {initialSchool.schoolCode}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Link href="/dashboard/settings">
                        <Button variant="outline" className="rounded-2xl border-zinc-900 bg-zinc-950/50 hover:border-eduGreen-500/30 transition-all h-12 px-6">
                            <Settings className="w-4 h-4 mr-2 text-zinc-500" />
                            Configuration
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <Card key={i} className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/50 hover:border-eduGreen-500/30 transition-all duration-500 overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-eduGreen-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <CardHeader className="flex flex-row items-center justify-between pb-3 space-y-0 relative z-10">
                            <CardTitle className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500 group-hover:text-eduGreen-500 transition-colors">
                                {stat.label}
                            </CardTitle>
                            <stat.icon className={`h-4 w-4 ${stat.color} group-hover:scale-110 transition-all`} />
                        </CardHeader>
                        <CardContent className="relative z-10 pt-2">
                            <div className="text-4xl font-black text-dm-textMain mb-1 tracking-tighter">{stat.value}</div>
                            <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">{stat.desc}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Main Grid Section */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* School Actions */}
                <div className="lg:col-span-8 space-y-8">
                    <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/80 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-zinc-700/30">
                        <CardHeader className="border-b border-zinc-900/80 pb-8 pt-8 px-10">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-eduGreen-950/20 rounded-2xl border border-eduGreen-900/30">
                                    <BarChart3 className="w-5 h-5 text-eduGreen-500" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black text-white tracking-tight">Infrastructure Management</CardTitle>
                                    <CardDescription className="text-zinc-600 font-bold uppercase tracking-widest text-[9px] mt-1">Core Academic Modules</CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-10">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {[
                                    { label: "Students", href: "/dashboard/students", icon: GraduationCap, desc: "Enrollment & Records" },
                                    { label: "Teachers", href: "/dashboard/teachers", icon: Users, desc: "Faculties & Access" },
                                    { label: "Parents", href: "/dashboard/parents", icon: Shield, desc: "Guardians & Safety" },
                                    { label: "Classes", href: "/dashboard/classes", icon: BookOpen, desc: "Curriculum & Schedules" },
                                    { label: "Events", href: "/dashboard/events", icon: Calendar, desc: "Timeline & Notifications" }
                                ].map((action, i) => (
                                    <Link key={i} href={action.href} className="group relative">
                                        <div className="h-full p-6 bg-zinc-950/50 border border-zinc-900 rounded-[1.5rem] hover:border-eduGreen-500/30 hover:bg-eduGreen-900/5 transition-all duration-300">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-zinc-900 flex items-center justify-center border border-zinc-800 group-hover:border-eduGreen-900/30 transition-colors">
                                                    <action.icon className="w-5 h-5 text-zinc-600 group-hover:text-eduGreen-500 transition-colors" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-zinc-100 group-hover:text-white transition-colors tracking-tight">{action.label}</p>
                                                    <p className="text-[10px] font-bold text-zinc-600 group-hover:text-zinc-500 transition-colors uppercase tracking-widest mt-0.5">{action.desc}</p>
                                                </div>
                                                <ArrowRight className="w-4 h-4 ml-auto text-zinc-800 group-hover:text-eduGreen-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Widget (Upcoming Events & Pulse) */}
                <div className="lg:col-span-4 space-y-8">
                    {/* Institutional Pulse */}
                    <Card className="bg-zinc-950/40 backdrop-blur-md border-zinc-900 shadow-2xl rounded-[2.5rem] overflow-hidden">
                        <CardHeader className="border-b border-zinc-900 pb-6 pt-8 px-8">
                            <div className="flex items-center gap-3">
                                <BarChart3 className="w-4 h-4 text-eduGreen-500" />
                                <CardTitle className="text-lg font-black text-white tracking-tight text-[10px] uppercase tracking-[0.2em]">Institutional Pulse</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Avg. Attendance</span>
                                <span className="text-xl font-black text-eduGreen-500">{institutionalMetrics.avgAttendance}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Exam Completion</span>
                                <span className="text-xl font-black text-emerald-500">{institutionalMetrics.examCompletion}</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div className="h-full bg-eduGreen-600 rounded-full transition-all duration-1000" style={{ width: institutionalMetrics.avgAttendance === '...' ? '0%' : institutionalMetrics.avgAttendance }} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/40 backdrop-blur-md border-zinc-800/80 shadow-2xl rounded-[2.5rem] overflow-hidden border-t-zinc-700/30">
                        <CardHeader className="border-b border-zinc-900/80 pb-6 pt-8 px-8">
                            <div className="flex items-center gap-3">
                                <Calendar className="w-4 h-4 text-eduGreen-500" />
                                <CardTitle className="text-lg font-black text-white tracking-tight">Timeline</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-8">
                            <UpcomingEventsWidget />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );

}
