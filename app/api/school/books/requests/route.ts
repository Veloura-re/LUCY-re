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
            select: { schoolId: true, role: true }
        });

        if (!dbUser?.schoolId) return new NextResponse("Missing context", { status: 404 });

        // Directors see all requests for the school, others see only their own
        const isDirector = dbUser.role === 'PRINCIPAL' || dbUser.role === 'SUPERADMIN';

        const requests = await prisma.bookRequest.findMany({
            where: {
                schoolId: dbUser.schoolId,
                ...(!isDirector && { userId: user.id })
            },
            include: {
                user: { select: { name: true, role: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(requests);
    } catch (error) {
        console.error("[BOOK_REQUESTS_GET]", error);
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
            select: { schoolId: true }
        });

        if (!dbUser?.schoolId) return new NextResponse("Context missing", { status: 400 });

        const body = await req.json();
        const { title, subject, grade, reason } = body;

        if (!title) return new NextResponse("Title required", { status: 400 });

        const request = await prisma.bookRequest.create({
            data: {
                schoolId: dbUser.schoolId,
                userId: user.id,
                title,
                subject,
                grade,
                reason
            }
        });

        return NextResponse.json(request);
    } catch (error) {
        console.error("[BOOK_REQUESTS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
