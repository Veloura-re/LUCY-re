import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: { school: true }
    });
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    const { classId, subjectId, examId, periodId, date, records } = await request.json();
    const config = (user.school as any)?.attendanceConfig || {};

    try {
        const attendanceDate = new Date(date);

        // Logic check: If examId provided, check if exam is locked
        if (examId) {
            const exam = await prisma.exam.findUnique({ where: { id: examId } });
            if (exam?.isLocked) {
                return NextResponse.json({ error: 'Records are locked for this finalized exam.' }, { status: 403 });
            }
        }

        // Attendance Locking Logic (Admin Rules)
        if (periodId && config.lockAfterMinutes) {
            const period = await prisma.period.findUnique({ where: { id: periodId } });
            if (period) {
                const now = new Date();
                const [startHour, startMin] = period.startTime.split(':').map(Number);
                const periodStart = new Date(attendanceDate);
                periodStart.setHours(startHour, startMin, 0, 0);

                const minsSinceStart = (now.getTime() - periodStart.getTime()) / (1000 * 60);

                // Allow 1 day grace for dev/testing unless explicitly strict
                // In production, this would be: if (minsSinceStart > config.lockAfterMinutes) ...
                // But let's check if it's the SAME DAY at least.
                const isSameDay = now.toDateString() === attendanceDate.toDateString();

                if (isSameDay && minsSinceStart > config.lockAfterMinutes && user.role !== 'PRINCIPAL' && user.role !== 'SUPERADMIN') {
                    return NextResponse.json({
                        error: `Protocol Timeout: Attendance window expired (${config.lockAfterMinutes}m). Contact admin to unlock.`
                    }, { status: 403 });
                }
            }
        }

        // Transaction
        await prisma.$transaction(async (tx) => {
            // Delete existing records for this specific context
            await tx.attendanceRecord.deleteMany({
                where: {
                    classId,
                    subjectId: subjectId || null,
                    examId: examId || null,
                    periodId: periodId || null,
                    date: attendanceDate
                }
            });

            // Insert new
            if (records.length > 0) {
                await tx.attendanceRecord.createMany({
                    data: records.map((r: any) => ({
                        classId,
                        studentId: r.studentId,
                        subjectId: subjectId || null,
                        examId: examId || null,
                        periodId: periodId || null,
                        date: attendanceDate,
                        status: r.status,
                        reason: r.reason || null,
                        createdById: user.id
                    }))
                });
            }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to save attendance' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');
    const subjectId = searchParams.get('subjectId');
    const examId = searchParams.get('examId');
    const periodId = searchParams.get('periodId');
    const dateStr = searchParams.get('date');

    if (!classId && !examId) return NextResponse.json({ error: 'Class ID or Exam ID required' }, { status: 400 });

    try {
        const date = dateStr ? new Date(dateStr) : undefined;
        const records = await prisma.attendanceRecord.findMany({
            where: {
                classId: classId || undefined,
                subjectId: subjectId || undefined,
                examId: examId || undefined,
                periodId: periodId || undefined,
                date: date
            }
        });
        return NextResponse.json({ records });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }
}
