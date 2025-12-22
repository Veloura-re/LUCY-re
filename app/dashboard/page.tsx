import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { DirectorView } from "@/components/dashboard/director-view";
import { ParentView } from "@/components/dashboard/parent-view";
import { TeacherView } from "@/components/dashboard/teacher-view";
import { StudentView } from "@/components/dashboard/student-view";
import { redirect } from "next/navigation";
// import TeacherView, StudentView etc.

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null; // Logic handled in layout, but safe check


    let dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            school: {
                include: {
                    _count: {
                        select: { students: true, users: true }
                    }
                }
            }
        }
    });

    // Fallback to email search if ID mismatch occurs
    if (!dbUser && user.email) {
        dbUser = await prisma.user.findUnique({
            where: { email: user.email },
            include: {
                school: {
                    include: {
                        _count: {
                            select: { students: true, users: true }
                        }
                    }
                }
            }
        });

        if (dbUser) {
            console.warn(`[Dashboard] ID mismatch for ${user.email}. Supabase: ${user.id}, Prisma: ${dbUser.id}`);
        }
    }

    if (!dbUser) return <div>User not found</div>;

    // SUPERADMIN should ONLY access /admin/dashboard
    if (dbUser.role === 'SUPERADMIN') {
        redirect('/admin/dashboard');
    }

    switch (dbUser.role) {
        case 'PRINCIPAL':
            return <DirectorView user={dbUser} school={dbUser.school} />;
        case 'HOMEROOM':
        case 'TEACHER':
            return <TeacherView user={dbUser} />;
        case 'PARENT':
            return <ParentView user={dbUser} />;
        case 'STUDENT':
            return <StudentView user={dbUser} />;
        default:
            return <div className="p-20 text-center font-black uppercase tracking-widest text-zinc-800">Operational Role Not Discovered</div>;
    }
}
