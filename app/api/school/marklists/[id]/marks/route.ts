import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole } from '@/lib/security';

// PUT: Bulk update marks
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL', 'TEACHER']);
        const examId = id;
        const { marks } = await request.json(); // Array of { studentId, score, remark }

        // Fetch Exam to verify locking and details
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { subject: true }
        });

        if (!exam) return NextResponse.json({ error: "Marklist not found" }, { status: 404 });
        if (exam.isLocked && user.role === 'TEACHER') {
            return NextResponse.json({ error: "Marklist is locked. Contact Admin." }, { status: 403 });
        }

        // Validate Teacher access again if strictly needed, but if they could view it...

        // Use transaction for bulk update
        const updates = marks.map((m: any) =>
            prisma.gradeRecord.upsert({
                where: {
                    studentId_examId: {
                        studentId: m.studentId,
                        examId: examId
                    }
                },
                update: {
                    score: parseFloat(m.score),
                    remark: m.remark || null,
                    status: 'SUBMITTED' // Or defaults
                },
                create: {
                    studentId: m.studentId,
                    examId: examId,
                    subjectId: exam.subjectId, // Redundant but required by schema
                    score: parseFloat(m.score),
                    remark: m.remark || null,
                    createdById: user.id
                }
            })
        );

        await prisma.$transaction(updates);

        return NextResponse.json({ success: true, count: updates.length });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message || "Failed to save marks" }, { status: 500 });
    }
}

// GET: Fetch detailed marks for this list
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await requireRole(['SUPERADMIN', 'PRINCIPAL', 'TEACHER']);
        const examId = id;

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                class: { include: { students: { orderBy: { lastName: 'asc' } } } },
                subject: true,
                gradeRecords: true
            }
        });

        if (!exam) return NextResponse.json({ error: "Marklist not found" }, { status: 404 });

        // Map students to their grades
        const studentsWithMarks = exam.class.students.map(student => {
            const grade = exam.gradeRecords.find(g => g.studentId === student.id);
            return {
                id: student.id,
                firstName: student.firstName,
                lastName: student.lastName,
                studentCode: student.studentCode,
                photoUrl: student.photoUrl,
                score: grade?.score ?? null, // null if no record
                remark: grade?.remark ?? "",
                gradeStatus: grade?.status
            };
        });

        return NextResponse.json({
            exam: {
                id: exam.id,
                title: exam.title,
                totalMarks: exam.totalMarks,
                category: exam.category,
                isLocked: exam.isLocked,
                subjectName: exam.subject.name,
                className: exam.class.name
            },
            students: studentsWithMarks
        });

    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
