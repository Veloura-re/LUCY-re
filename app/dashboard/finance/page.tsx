import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FinanceView } from "@/components/dashboard/finance-view";
import { ParentBillingView } from "@/components/dashboard/parent-billing-view";

export default async function FinancePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            school: {
                include: {
                    grades: {
                        orderBy: { level: 'asc' }
                    }
                }
            }
        }
    }) as any;

    if (!dbUser) redirect("/login");

    if (dbUser.role === 'PRINCIPAL' || dbUser.role === 'SUPERADMIN') {
        return <FinanceView user={dbUser} school={dbUser.school} grades={dbUser.school?.grades || []} />;
    }

    if (dbUser.role === 'PARENT') {
        const studentLinks = await prisma.parentStudentLink.findMany({
            where: { parentId: dbUser.id },
            include: {
                student: {
                    include: {
                        school: true,
                        invoices: {
                            include: {
                                items: true,
                                payments: true
                            },
                            orderBy: { createdAt: 'desc' }
                        }
                    } as any
                }
            }
        }) as any[];

        const students = studentLinks.map(link => link.student);
        return <ParentBillingView user={dbUser} students={students} />;
    }

    // Default fallback
    redirect("/dashboard");
}
