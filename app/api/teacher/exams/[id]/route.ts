import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/utils/supabase/server";
import { sendAssessmentReportEmail } from "@/lib/email";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user || user.user_metadata.role !== 'TEACHER') {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { questions, isLocked, isPublished, title, duration, config } = body;

        // Verify ownership?
        const exam = await prisma.exam.findUnique({ where: { id: params.id } });
        if (!exam) return NextResponse.json({ error: "Not found" }, { status: 404 });
        if (exam.createdById !== user.id) return NextResponse.json({ error: "Access Denied" }, { status: 403 });

        const updated = await prisma.exam.update({
            where: { id: params.id },
            data: {
                questions: questions ?? undefined,
                isLocked: isLocked ?? undefined,
                isPublished: isPublished ?? undefined,
                title: title ?? undefined,
                duration: duration ?? undefined,
                config: config ?? undefined,
            } as any,
            include: { subject: true }
        });

        // NOTIFICATION LOGIC: Trigger if just published
        if (isPublished === true && !(exam as any).isPublished) {
            console.log(`[EXAM_PUBLISH] Triggering notifications for Exam: ${updated.id}`);

            // Fetch all students in the class and their grades/attendance for this exam
            const students = await prisma.student.findMany({
                where: { classId: updated.classId },
                include: {
                    parentLinks: { include: { parent: true } },
                    gradeRecords: { where: { examId: params.id } },
                    attendanceRecords: { where: { examId: params.id } }
                }
            });

            const maxScore = (updated.config as any)?.maxScore || 100;

            console.log(`[EXAM_PUBLISH] Notifying ${students.length} students/parents.`);

            for (const student of students) {
                const grade = student.gradeRecords[0];
                const att = student.attendanceRecords[0];
                const studentName = `${student.firstName} ${student.lastName}`;

                // If neither grade nor attendance found, skip (unlikely if graded properly)
                if (!grade && !att) continue;

                for (const link of student.parentLinks) {
                    if (link.parent.email) {
                        // Background send-off
                        sendAssessmentReportEmail(
                            link.parent.email,
                            studentName,
                            updated.title,
                            (updated as any).subject.name,
                            grade?.score || 0,
                            maxScore,
                            att?.status || 'PRESENT',
                            grade?.remark || undefined
                        ).catch(err => console.error(`Failed to notify parent of student ${student.id}:`, err));
                    }
                }
            }
        }

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
