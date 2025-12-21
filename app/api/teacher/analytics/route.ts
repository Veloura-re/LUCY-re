import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        // Fetch teacher's classes
        const assignments = await prisma.teacherAssignment.findMany({
            where: { teacherId: user.id },
            select: { classId: true }
        });

        const classIds = assignments.map(a => a.classId);

        // Calculate attendance rate for teacher's classes
        const totalAttendance = await prisma.attendanceRecord.count({
            where: { classId: { in: classIds } }
        });
        const presentAttendance = await prisma.attendanceRecord.count({
            where: {
                classId: { in: classIds },
                status: { in: ['PRESENT', 'LATE'] }
            }
        });

        // "Missing records" logic: could be classes/periods with no attendance today
        // For simplicity, let's just return a placeholder or calculate based on timetable
        const missingCount = 0; // Logic for missing records would involve checking today's timetable vs attendanceRecords

        return NextResponse.json({
            attendanceRate: totalAttendance > 0 ? `${((presentAttendance / totalAttendance) * 100).toFixed(0)}%` : "100%",
            missingCount
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch teacher analytics' }, { status: 500 });
    }
}
