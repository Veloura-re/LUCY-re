import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const student = await prisma.student.findFirst({
            where: { userId: user.id }
        });

        if (!student || !student.classId) {
            return NextResponse.json({ error: "Student profile not active" }, { status: 404 });
        }

        const exams = await prisma.exam.findMany({
            where: { classId: student.classId },
            include: {
                subject: true,
                gradeRecords: {
                    where: { studentId: student.id }
                }
            },
            orderBy: { dueAt: 'desc' }
        });

        const formattedExams = exams.map(exam => {
            const now = new Date();
            const dueAt = exam.dueAt ? new Date(exam.dueAt) : null;

            let status = "UPCOMING";
            if (exam.isPublished) {
                status = "COMPLETED";
            } else if (dueAt && dueAt < now) {
                status = "MISSED";
            } else if (dueAt && dueAt.toDateString() === now.toDateString()) {
                // If it's today, we could check if it's "Active" based on duration/time
                // For now, simplify: if it's today and not published, it's ACTIVE for testing visibility
                status = "ACTIVE";
            }

            return {
                id: exam.id,
                title: exam.title,
                subject: exam.subject.name,
                date: exam.dueAt,
                duration: exam.duration || 60,
                status,
                score: exam.isPublished ? exam.gradeRecords[0]?.score : undefined,
                isPublished: exam.isPublished
            };
        });

        return NextResponse.json({ exams: formattedExams });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
