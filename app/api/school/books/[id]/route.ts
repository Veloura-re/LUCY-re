import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
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

        const body = await req.json();
        const book = await prisma.book.findUnique({
            where: { id: params.id }
        });

        if (!book || book.schoolId !== dbUser.schoolId) {
            return new NextResponse("Book not found", { status: 404 });
        }

        const updatedBook = await prisma.book.update({
            where: { id: params.id },
            data: { ...body }
        });

        return NextResponse.json(updatedBook);
    } catch (error) {
        console.error("[BOOK_PATCH]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}

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

        const book = await prisma.book.findUnique({
            where: { id: params.id }
        });

        if (!book || book.schoolId !== dbUser.schoolId) {
            return new NextResponse("Book not found", { status: 404 });
        }

        await prisma.book.delete({
            where: { id: params.id }
        });

        return new NextResponse("Book deleted", { status: 200 });
    } catch (error) {
        console.error("[BOOK_DELETE]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
