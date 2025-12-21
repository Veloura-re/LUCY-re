import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata?.role !== 'ADMIN') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const { messageId, isPinned, isDeleted } = await req.json();

        if (isDeleted) {
            await prisma.message.delete({
                where: { id: messageId }
            });
            return NextResponse.json({ success: true });
        }

        const updated = await prisma.message.update({
            where: { id: messageId },
            data: {
                isPinned: isPinned ?? undefined,
            }
        });

        return NextResponse.json({ message: updated });
    } catch (e) {
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }
}
