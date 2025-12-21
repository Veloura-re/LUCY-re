import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { RoleBadge } from "@/components/ui/role-badge";
import { ShieldCheck, LayoutDashboard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/auth/sign-out-button";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    let dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, email: true, name: true }
    });

    // Fallback to email search if ID mismatch occurs (common in dev/manual seeding)
    if (!dbUser && user.email) {
        dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            select: { id: true, role: true, email: true, name: true }
        });

        if (dbUser) {
            console.warn(`[AdminLayout] ID mismatch for ${user.email}. Supabase: ${user.id}, Prisma: ${dbUser.id}`);
            // We could sync IDs here if needed: await prisma.user.update(...) 
            // but that might be complex if there are relational constraints.
            // For now, allowing email-based auth is enough to break the loop.
        }
    }

    if (!dbUser || dbUser.role !== 'SUPERADMIN') {
        console.error(`[AdminLayout] Auth failed for ${user.email}. Role in DB: ${dbUser?.role || 'NONE'}`);
        redirect("/login");
    }

    // Sync role to Supabase metadata if it's missing or wrong
    if (user.user_metadata?.role !== dbUser.role) {
        await supabase.auth.updateUser({
            data: { role: dbUser.role }
        });
    }

    return (
        <div className="min-h-screen bg-zinc-950 flex md:flex-row flex-col font-sans text-white relative overflow-hidden">
            {/* Immersive Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[60%] h-[60%] rounded-full bg-eduGreen-500/10 blur-[140px] animate-pulse duration-[10s]" />
                <div className="absolute top-[20%] -right-[15%] w-[70%] h-[70%] rounded-full bg-emerald-500/15 blur-[120px] animate-pulse duration-[8s]" />
                <div className="absolute bottom-[-10%] left-[30%] w-[40%] h-[40%] rounded-full bg-eduGreen-600/10 blur-[100px]" />

                {/* Subtle Grid Overlay */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
            </div>

            {/* Sidebar */}
            <aside className="w-full md:w-72 bg-zinc-950/50 backdrop-blur-xl border-r border-zinc-900/50 p-8 flex flex-col relative z-20">
                <div className="mb-12">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-eduGreen-950/30 rounded-xl flex items-center justify-center border border-eduGreen-900/20 shadow-[0_0_15px_rgba(20,122,82,0.1)]">
                            <ShieldCheck className="w-6 h-6 text-eduGreen-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white tracking-tighter">LUCY</h1>
                            <p className="text-[10px] uppercase tracking-widest text-zinc-600 font-medium">Admin Engine v1.0</p>
                        </div>
                    </div>
                </div>

                <nav className="space-y-1.5 flex-1">
                    <a
                        href="/admin/dashboard"
                        className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-eduGreen-900/20 text-eduGreen-400 border border-eduGreen-900/30 font-semibold text-sm transition-all shadow-lg shadow-black/20"
                    >
                        <LayoutDashboard className="w-4 h-4" />
                        Master Dashboard
                    </a>
                </nav>

                <div className="pt-8 border-t border-zinc-900 mt-auto">
                    <div className="px-2 mb-6">
                        <div className="text-[10px] uppercase tracking-widest text-zinc-700 font-semibold mb-1">Authenticated as</div>
                        <div className="text-sm font-medium text-zinc-400 truncate">{user.email}</div>
                    </div>
                    <SignOutButton />
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-12 relative z-10 overflow-y-auto">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-12">
                    <div>
                        <h2 className="text-3xl font-bold text-white tracking-tight">System Overview</h2>
                        <p className="text-sm text-zinc-500 font-normal">Monitoring and scaling the LUCY infrastructure.</p>
                    </div>
                    <div className="flex items-center gap-4 bg-zinc-900/40 backdrop-blur-md border border-zinc-800 p-2 pl-4 rounded-2xl shadow-xl">
                        <span className="text-xs font-medium text-zinc-400 uppercase tracking-widest hidden lg:block">Access Level:</span>
                        <RoleBadge role="SUPERADMIN" className="py-1.5 px-4 rounded-xl" />
                    </div>
                </header>
                {children}
            </main>
        </div>
    );
}
