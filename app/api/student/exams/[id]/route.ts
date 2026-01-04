import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request, { params }: { params: { id: string } }) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const student = await prisma.student.findFirst({
            where: { userId: user.id }
        });

        if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 });

        const exam = await prisma.exam.findUnique({
            where: { id: params.id },
            include: { subject: true }
        });

        if (!exam) return NextResponse.json({ error: "Exam not found" }, { status: 404 });

        // Ensure student is in the class
        if (exam.classId !== student.classId) {
            return NextResponse.json({ error: "Access Denied" }, { status: 403 });
        }

        // Check if student already has a submitted attempt
        const existingAttempt = await prisma.examAttempt.findFirst({
            where: { examId: exam.id, studentId: student.id, status: 'SUBMITTED' }
        });

        if (existingAttempt) {
            return NextResponse.json({ error: "Assessment already submitted" }, { status: 400 });
        }

        // Prepare safe question data (hide correct answers if they are in the same JSON)
        const rawQuestions = exam.questions as any[] || [];
        const safeQuestions = rawQuestions.map((q: any) => ({
            id: q.id,
            text: q.text,
            type: q.type,
            options: q.options,
            points: q.points
        }));

        return NextResponse.json({
            exam: {
                id: exam.id,
                title: exam.title,
                duration: exam.duration,
                subject: exam.subject.name,
                questions: safeQuestions
            }
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
