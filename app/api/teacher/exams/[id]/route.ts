import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata.role !== 'TEACHER') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { questions, isLocked, title, duration } = body;

        // Verify ownership?
        const exam = await prisma.exam.findUnique({ where: { id: params.id } });
        if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (exam.createdById !== user.id) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

        const updated = await prisma.exam.update({
            where: { id: params.id },
            data: {
                questions: questions ?? undefined,
                isLocked: isLocked ?? undefined,
                title: title ?? undefined,
                duration: duration ?? undefined,
                // Automatically config max score based on questions? 
                // Currently config is separate.
            }
        });

        return NextResponse.json({ exam: updated });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Failed to update exam" }, { status: 500 });
    }
}

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Student needs access too (for Taking Exam)
    // Teacher needs access (for Editing)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    try {
        const exam = await prisma.exam.findUnique({
            where: { id: params.id },
            include: { subject: true, class: true }
        });
        return NextResponse.json({ exam });
    } catch (e) {
        return NextResponse.json({ error: "Failed to fetch" }, { status: 500 });
    }
}
