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

        if (!dbUser?.schoolId) return new NextResponse("Institutional context missing", { status: 404 });

        const { searchParams } = new URL(req.url);
        const gradeId = searchParams.get("gradeId");
        const subjectId = searchParams.get("subjectId");
        const classId = searchParams.get("classId");
        const query = searchParams.get("query");

        const books = await prisma.book.findMany({
            where: {
                schoolId: dbUser.schoolId,
                ...(gradeId && { gradeId }),
                ...(subjectId && { subjectId }),
                ...(classId && { classId }),
                ...(query && {
                    OR: [
                        { title: { contains: query, mode: 'insensitive' } },
                        { author: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                }),
                // Optionally filter out expired for students
                ...(dbUser.role === 'STUDENT' && {
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                })
            },
            include: {
                grade: true,
                subject: true,
                class: true,
                prerequisite: true // For UI check
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(books);
    } catch (error) {
        console.error("[BOOKS_GET]", error);
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
            return new NextResponse("Forbidden - Principal authority required", { status: 403 });
        }

        const body = await req.json();
        const {
            title,
            fileUrl,
            gradeId,
            classId,
            subjectId,
            author,
            academicYear,
            edition,
            description,
            teacherNote,
            expiresAt,
            prerequisiteId
        } = body;

        if (!title || !fileUrl || !gradeId || !classId || !subjectId) {
            return new NextResponse("Missing mandatory fields (Title, File, Grade, Section, Subject)", { status: 400 });
        }

        // Duplicate Check: Grade + Subject + Class Section + Book Title
        const existing = await prisma.book.findFirst({
            where: {
                schoolId: dbUser.schoolId,
                gradeId,
                subjectId,
                classId,
                title: { equals: title, mode: 'insensitive' }
            }
        });

        if (existing) {
            return new NextResponse("Book with this title already exists for this section and subject", { status: 409 });
        }

        const book = await prisma.book.create({
            data: {
                schoolId: dbUser.schoolId,
                gradeId,
                classId,
                subjectId,
                title,
                fileUrl,
                author,
                academicYear,
                edition,
                description,
                teacherNote,
                expiresAt: expiresAt ? new Date(expiresAt) : null,
                prerequisiteId: prerequisiteId || null
            }
        });

        return NextResponse.json(book);
    } catch (error) {
        console.error("[BOOKS_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
