import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { schoolId: true }
        });

        if (!dbUser?.schoolId) return new NextResponse("Context missing", { status: 404 });

        const units = await prisma.unitPack.findMany({
            where: { schoolId: dbUser.schoolId },
            include: {
                resources: {
                    include: {
                        book: {
                            include: { subject: true, grade: true }
                        }
                    },
                    orderBy: { order: 'asc' }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(units);
    } catch (error) {
        console.error("[UNIT_PACKS_GET]", error);
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

        if (dbUser?.role !== 'PRINCIPAL' && dbUser?.role !== 'SUPERADMIN') {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { title, description, resourceIds } = body;

        if (!title) return new NextResponse("Title required", { status: 400 });

        const unit = await prisma.unitPack.create({
            data: {
                schoolId: dbUser.schoolId!,
                title,
                description,
                resources: {
                    create: (resourceIds || []).map((id: string, index: number) => ({
                        bookId: id,
                        order: index
                    }))
                }
            },
            include: { resources: true }
        });

        return NextResponse.json(unit);
    } catch (error) {
        console.error("[UNIT_PACKS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
