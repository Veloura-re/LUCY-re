import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { bookId, completed } = body;

        if (!bookId) return new NextResponse("Book ID required", { status: 400 });

        const progress = await prisma.resourceProgress.upsert({
            where: {
                userId_bookId: {
                    userId: user.id,
                    bookId: bookId
                }
            },
            update: { completed: !!completed },
            create: {
                userId: user.id,
                bookId: bookId,
                completed: !!completed
            }
        });

        return NextResponse.json(progress);
    } catch (error) {
        console.error("[RESOURCE_PROGRESS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const progress = await prisma.resourceProgress.findMany({
            where: { userId: user.id }
        });

        return NextResponse.json(progress);
    } catch (error) {
        console.error("[RESOURCE_PROGRESS_GET]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
