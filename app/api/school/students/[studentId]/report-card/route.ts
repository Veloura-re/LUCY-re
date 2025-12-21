import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole } from '@/lib/security';

export async function GET(request: Request, { params }: { params: { studentId: string } }) {
    try {
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT']);
        const { studentId } = params;

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                class: {
                    include: {
                        grade: true
                    }
                },
                school: true
            }
        });

        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

        // [SECURITY] Tenant Isolation
        if (user.role !== 'SUPERADMIN' && student.schoolId !== user.schoolId) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Fetch all grades for this student
        const grades = await prisma.gradeRecord.findMany({
            where: { studentId },
            include: {
                subject: true,
                exam: true
            },
            orderBy: { exam: { availableFrom: 'asc' } }
        });

        // Fetch attendance
        const attendance = await prisma.attendanceRecord.findMany({
            where: { studentId }
        });

        // Fetch remarks
        const remarks = await prisma.studentRemark.findMany({
            where: { studentId },
            include: { teacher: true },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({
            student,
            grades,
            attendance: {
                total: attendance.length,
                present: attendance.filter(a => a.status === 'PRESENT').length,
                late: attendance.filter(a => a.status === 'LATE').length,
                absent: attendance.filter(a => a.status === 'ABSENT').length
            },
            remarks
        });

    } catch (e) {
        return handleApiError(e);
    }
}
