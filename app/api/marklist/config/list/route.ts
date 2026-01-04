import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json([], { status: 401 });

        // Get user's school
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { schoolId: true, role: true }
        });

        if (!dbUser?.schoolId) return NextResponse.json([]);

        // Fetch Configs
        const configs = await prisma.marklistConfig.findMany({
            where: {
                schoolId: dbUser.schoolId,
                // Optional: filter by teacherId if role is TEACHER?
                // For now, list all. Teacher might want to see others or just theirs. 
                // Director wants to see all.
            },
            include: {
                class: { select: { name: true } },
                subject: { select: { name: true } },
                columns: { select: { id: true } } // just count
            },
            orderBy: { updatedAt: 'desc' }
        });

        return NextResponse.json(configs);
    } catch (error) {
        console.error("List Config Error:", error);
        return NextResponse.json({ error: "Failed to list configurations" }, { status: 500 });
    }
}
