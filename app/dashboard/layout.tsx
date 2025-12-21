import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { RoleBadge } from "@/components/ui/role-badge";
import {
    LayoutDashboard,
    Users,
    BookOpen,
    Calendar,
    MessageSquare,
    Settings,
    LogOut,
    GraduationCap,
    BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch full user profile with role
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { school: true }
    });

    if (!dbUser) {
        // Instead of a plain redirect which triggers a loop if middleware sees 'user' but not 'dbUser',
        // we redirect with a specific flag or just handle the error here.
        redirect("/login?error=profile_not_found");
    }

    const role = dbUser.role;

    // Navigation Items Config
    const navItems = {
        PRINCIPAL: [
            { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
            { icon: Users, label: "Teachers", href: "/dashboard/teachers" },
            { icon: GraduationCap, label: "Students", href: "/dashboard/students" },
            { icon: BookOpen, label: "Classes", href: "/dashboard/classes" },
            { icon: Users, label: "Staffing", href: "/dashboard/staffing" },
            { icon: Calendar, label: "Timetable", href: "/dashboard/timetable" },
            { icon: Users, label: "Attendance", href: "/dashboard/attendance/settings" },
            { icon: BarChart3, label: "Reports", href: "/dashboard/reports" },
            { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
            { icon: Settings, label: "Settings", href: "/dashboard/settings" },
        ],
        TEACHER: [
            { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
            { icon: Calendar, label: "Schedule", href: "/dashboard/teacher/schedule" },
            { icon: Users, label: "Attendance", href: "/dashboard/teacher/attendance" },
            { icon: GraduationCap, label: "Grades", href: "/dashboard/teacher/exams" },
            { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
            { icon: Settings, label: "Settings", href: "/dashboard/settings" },
        ],
        HOMEROOM: [
            { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
            { icon: Users, label: "My Homeroom", href: "/dashboard/homeroom" },
            { icon: BookOpen, label: "My Classes", href: "/dashboard/classes" },
            { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
            { icon: Settings, label: "Settings", href: "/dashboard/settings" },
        ],
        PARENT: [
            { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
            { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
            { icon: Settings, label: "Settings", href: "/dashboard/settings" },
        ],
        STUDENT: [
            { icon: LayoutDashboard, label: "Overview", href: "/dashboard" },
            { icon: Calendar, label: "Timetable", href: "/dashboard/student/timetable" },
            { icon: MessageSquare, label: "Messages", href: "/dashboard/messages" },
            { icon: Settings, label: "Settings", href: "/dashboard/settings" },
        ],
    };

    const menu = navItems[role as keyof typeof navItems] || [
        { icon: LayoutDashboard, label: "Overview", href: "/dashboard" }
    ];

    return (
        <div className="min-h-screen bg-zinc-950 flex md:flex-row flex-col font-sans text-white relative overflow-hidden">
            {/* Immersive Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-eduGreen-500/10 blur-[140px] animate-pulse duration-[10s]" />
                <div className="absolute top-[20%] -right-[15%] w-[70%] h-[70%] rounded-full bg-eduGreen-600/10 blur-[120px] animate-pulse duration-[8s]" />
                <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[40%] rounded-full bg-eduGreen-600/10 blur-[100px]" />

                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* Sidebar */}
            <aside className="w-full md:w-72 bg-zinc-950/40 backdrop-blur-2xl border-r border-zinc-900/50 flex flex-col relative z-20">
                <div className="p-8 pb-10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-eduGreen-950/30 rounded-xl flex items-center justify-center border border-eduGreen-900/20 shadow-[0_0_15px_rgba(20,122,82,0.1)]">
                            <span className="text-xl">🎓</span>
                        </div>
                        <div>
                            <h1 className="text-xl font-black text-white tracking-tighter">LUCY</h1>
                            {dbUser.school && (
                                <p className="text-[9px] uppercase tracking-widest text-zinc-600 font-bold truncate max-w-[140px]">{dbUser.school.name}</p>
                            )}
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
                    {menu.map((item) => (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant="ghost"
                                className="w-full justify-start gap-3 h-12 px-4 rounded-2xl text-zinc-500 hover:text-eduGreen-400 hover:bg-eduGreen-900/10 hover:border-eduGreen-900/30 transition-all group font-semibold text-sm"
                            >
                                <item.icon className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                {item.label}
                            </Button>
                        </Link>
                    ))}
                </nav>

                <div className="p-8 border-t border-zinc-900/50 mt-auto">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 font-black shadow-2xl">
                            {dbUser.name[0]}
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold truncate text-zinc-100 tracking-tight">{dbUser.name}</p>
                            <RoleBadge role={role} className="mt-1" />
                        </div>
                    </div>

                    <SignOutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 relative z-10 overflow-y-auto">
                {children}
            </main>
        </div>
    );
}
