import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { AttendanceStatus } from '@prisma/client';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const date = searchParams.get('date');
    const subjectId = searchParams.get('subjectId');
    const periodId = searchParams.get('periodId');

    if (!classId || !date) {
        return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    try {
        const attendance = await prisma.attendanceRecord.findMany({
            where: {
                classId,
                date: new Date(date),
                ...(subjectId ? { subjectId } : { subjectId: null }),
                ...(periodId ? { periodId } : { periodId: null }),
            }
        });

        return NextResponse.json({ attendance });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { school: true }
    });
    if (!user || !user.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    try {
        const { classId, date, subjectId, periodId, examId, records } = await request.json();

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const config = (user.school as any)?.attendanceConfig || {};

        // 1. Exam Locking Logic
        if (examId) {
            const exam = await prisma.exam.findUnique({ where: { id: examId } });
            if (exam?.isLocked) {
                return NextResponse.json({ error: 'Records are locked for this finalized exam.' }, { status: 403 });
            }
        }

        // 2. Attendance Locking Logic (Operational Window)
        if (periodId && config.lockAfterMinutes) {
            const period = await prisma.period.findUnique({ where: { id: periodId } });
            if (period) {
                const now = new Date();
                const [startHour, startMin] = period.startTime.split(':').map(Number);
                const periodStart = new Date(attendanceDate);
                periodStart.setHours(startHour, startMin, 0, 0);

                const minsSinceStart = (now.getTime() - periodStart.getTime()) / (1000 * 60);
                const isSameDay = now.toDateString() === attendanceDate.toDateString();

                if (isSameDay && minsSinceStart > config.lockAfterMinutes && !['PRINCIPAL', 'SUPERADMIN'].includes(user.role)) {
                    return NextResponse.json({
                        error: `Protocol Timeout: Attendance window expired (${config.lockAfterMinutes}m). Contact admin to unlock.`
                    }, { status: 403 });
                }
            }
        }

        // 3. Atomic Update via Transaction
        await prisma.$transaction(async (tx) => {
            // Purge existing records for this specific metadata
            await tx.attendanceRecord.deleteMany({
                where: {
                    classId,
                    date: attendanceDate,
                    subjectId: subjectId || null,
                    periodId: periodId || null,
                    examId: examId || null
                }
            });

            // Bulk Insert new records
            if (records.length > 0) {
                await tx.attendanceRecord.createMany({
                    data: records.map((record: any) => ({
                        studentId: record.studentId,
                        classId,
                        subjectId: subjectId || null,
                        periodId: periodId || null,
                        examId: examId || null,
                        date: attendanceDate,
                        status: record.status,
                        reason: record.reason || null,
                        createdById: user.id
                    }))
                });
            }
        });

        return NextResponse.json({ success: true, count: records.length });

    } catch (e) {
        console.error("Error saving attendance:", e);
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
    }
}
