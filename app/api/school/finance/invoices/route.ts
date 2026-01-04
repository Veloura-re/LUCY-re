import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!dbUser || !dbUser.schoolId) return new NextResponse("School not found", { status: 404 });

        const invoices = await prisma.invoice.findMany({
            where: { schoolId: dbUser.schoolId },
            include: {
                student: {
                    select: { firstName: true, lastName: true, studentCode: true }
                },
                payments: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(invoices);
    } catch (error: any) {
        return new NextResponse("Internal Error", { status: 500 });
    }
}
