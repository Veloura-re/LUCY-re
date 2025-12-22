import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    req: Request,
    { params }: { params: { id: string } }
) {
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

        const feeId = params.id;

        await prisma.feeStructure.delete({
            where: {
                id: feeId,
                schoolId: dbUser.schoolId
            }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[FEE_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
