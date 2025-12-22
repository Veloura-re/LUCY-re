import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { schoolId: true, role: true }
        });

        if (!dbUser?.schoolId || (dbUser.role !== 'PRINCIPAL' && dbUser.role !== 'SUPERADMIN')) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const fees = await prisma.feeStructure.findMany({
            where: { schoolId: dbUser.schoolId },
            include: { grade: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(fees);
    } catch (error) {
        console.error("[FEES_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { schoolId: true, role: true }
        });

        if (!dbUser?.schoolId || (dbUser.role !== 'PRINCIPAL' && dbUser.role !== 'SUPERADMIN')) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { name, amount, category, frequency, gradeId, description } = body;

        if (!name || amount === undefined || !category || !frequency) {
            return new NextResponse("Missing required fields", { status: 400 });
        }

        const fee = await prisma.feeStructure.create({
            data: {
                schoolId: dbUser.schoolId,
                gradeId,
                name,
                amount: parseFloat(amount),
                category,
                frequency,
                description
            }
        });

        return NextResponse.json(fee);
    } catch (error) {
        console.error("[FEES_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
