import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole } from '@/lib/security';

export async function POST(request: Request) {
    try {
        const user = await requireRole(['TEACHER', 'PRINCIPAL', 'HOMEROOM']);
        const { examId, grades, attendance } = await request.json(); // grades: [{ studentId, score }], attendance: [{ studentId, status, reason }]

        if (!examId || !grades || !Array.isArray(grades)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: { subject: true }
        });

        if (!exam) return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
        if (exam.isLocked) return NextResponse.json({ error: 'Exam is finalized and locked' }, { status: 403 });

        const userSchoolId = user.schoolId;
        const examData = await prisma.class.findUnique({
            where: { id: exam.classId },
            include: { grade: true }
        });
        const examSchoolId = examData?.grade.schoolId;

        if (!examSchoolId || userSchoolId !== examSchoolId) {
            return NextResponse.json({ error: 'Forbidden: Exam does not belong to your school' }, { status: 403 });
        }

        // Processing within a transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Save Attendance if provided
            if (attendance && Array.isArray(attendance)) {
                for (const att of attendance) {
                    await tx.attendanceRecord.upsert({
                        where: {
                            // We need a unique constraint or we delete/insert
                            // Since we don't have a unique constraint on [examId, studentId], 
                            // we'll use a custom delete/insert or use findFirst.
                            // Better: Add unique constraint to schema later. 
                            // For now: delete existing for this exam/student pair
                            id: (await tx.attendanceRecord.findFirst({
                                where: { examId, studentId: att.studentId }
                            }))?.id || 'non-existent'
                        },
                        create: {
                            examId,
                            studentId: att.studentId,
                            classId: exam.classId,
                            subjectId: exam.subjectId,
                            status: att.status,
                            reason: att.reason,
                            date: new Date(),
                            createdById: user.id
                        },
                        update: {
                            status: att.status,
                            reason: att.reason,
                            createdById: user.id
                        }
                    });
                }
            }

            // 2. Save Grades
            const savedGrades = [];
            for (const g of grades) { // g can now have: studentId, score, remark, status
                const attRecord = await tx.attendanceRecord.findFirst({
                    where: { examId, studentId: g.studentId }
                });

                if (attRecord?.status === 'ABSENT') continue;

                const existingGrade = await tx.gradeRecord.findFirst({
                    where: { examId, studentId: g.studentId }
                });

                let gradeRecord;
                if (existingGrade) {
                    gradeRecord = await tx.gradeRecord.update({
                        where: { id: existingGrade.id },
                        data: {
                            score: parseFloat(g.score),
                            remark: g.remark,
                            status: g.status || 'SUBMITTED',
                            createdById: user.id
                        }
                    });
                } else {
                    gradeRecord = await tx.gradeRecord.create({
                        data: {
                            studentId: g.studentId,
                            examId: examId,
                            subjectId: exam.subjectId,
                            score: parseFloat(g.score),
                            remark: g.remark,
                            status: g.status || 'SUBMITTED',
                            createdById: user.id,
                        }
                    });
                }
                savedGrades.push(gradeRecord);
            }

            // 3. Audit Logging
            await tx.auditLog.create({
                data: {
                    userId: user.id,
                    action: 'EXAM_MARK_ENTRY',
                    resourceType: 'EXAM',
                    resourceId: examId,
                    before: { message: "Previous marks state overwritten" },
                    after: {
                        count: savedGrades.length,
                        examTitle: exam.title,
                        subject: exam.subject.name
                    }
                }
            });

            return savedGrades;
        });

        return NextResponse.json({ success: true, count: result.length });

    } catch (e) {
        return handleApiError(e);
    }
}

export async function GET(request: Request) {
    try {
        // [SECURITY] Any staff can view grades? Limiting to staff for now.
        const user = await requireRole(['TEACHER', 'PRINCIPAL', 'HOMEROOM', 'SUPERADMIN']);

        const { searchParams } = new URL(request.url);
        const examId = searchParams.get('examId');

        if (!examId) return NextResponse.json({ error: 'Exam ID required' }, { status: 400 });

        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                class: { include: { grade: true } }, // Include grade to check schoolId
                subject: true
            }
        });

        // [SECURITY] Tenant Isolation
        if (!exam || (user.role !== 'SUPERADMIN' && exam.class?.grade?.schoolId !== user.schoolId)) {
            // Return 404 to mask existence if from another school
            return NextResponse.json({ error: 'Exam not found or access denied' }, { status: 404 });
        }

        const graderecords = await prisma.gradeRecord.findMany({
            where: { examId },
        });

        return NextResponse.json({ exam, graderecords });

    } catch (e) {
        return handleApiError(e);
    }
}
