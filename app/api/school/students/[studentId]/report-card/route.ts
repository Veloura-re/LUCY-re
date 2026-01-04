import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole } from '@/lib/security';

export async function GET(request: Request, { params }: { params: Promise<{ studentId: string }> }) {
    try {
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT']);
        const { studentId } = await params;

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
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: { studentId },
            orderBy: { date: 'desc' },
            take: 30
        });

        // For counts, we need the full list (or use prisma.count but this is simpler for now given existing logic)
        const allAttendance = await prisma.attendanceRecord.findMany({
            where: { studentId }
        });

        // Fetch remarks
        const remarks = await prisma.studentRemark.findMany({
            where: { studentId },
            include: { teacher: true },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch Internal Notes (Confidential - Staff Only)
        let internalNotes: any[] = [];
        if (['SUPERADMIN', 'PRINCIPAL', 'TEACHER'].includes(user.role)) {
            internalNotes = await prisma.internalNote.findMany({
                where: { studentId },
                include: { author: true },
                orderBy: { createdAt: 'desc' }
            });
        }

        return NextResponse.json({
            student,
            grades,
            attendance: {
                total: allAttendance.length,
                present: allAttendance.filter(a => a.status === 'PRESENT').length,
                late: allAttendance.filter(a => a.status === 'LATE').length,
                absent: allAttendance.filter(a => a.status === 'ABSENT').length,
                history: attendanceRecords
            },
            remarks,
            internalNotes
        });

    } catch (e) {
        return handleApiError(e);
    }
}
