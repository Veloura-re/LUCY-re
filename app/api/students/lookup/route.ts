import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: "Code required" }, { status: 400 });
    }

    // Find the student with this code
    const student = await prisma.student.findUnique({
        where: { studentCode: code },
        include: { user: true }
    });

    if (!student || !student.user) {
        return NextResponse.json({ users: [] }); // Return empty if not found or not registered
    }

    // Return limited info
    return NextResponse.json({
        users: [{
            id: student.user.id,
            name: student.user.name,
            role: "STUDENT",
            // code: student.studentCode // Don't return code, they already have it
        }]
    });
}
