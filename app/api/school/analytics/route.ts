import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { schoolId: true, role: true }
    });

    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    try {
        // 1. Attendance Trends (Last 7 Days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const attendance = await prisma.attendanceRecord.groupBy({
            by: ['date', 'status'],
            where: {
                class: { grade: { schoolId: dbUser.schoolId } },
                date: { gte: sevenDaysAgo }
            },
            _count: { id: true }
        });

        // 2. Grade Distribution (Mean scores per subject)
        const gradeStats = await prisma.gradeRecord.groupBy({
            by: ['subjectId'],
            where: {
                subject: { schoolId: dbUser.schoolId }
            },
            _avg: { score: true },
            _count: { id: true }
        });

        // Resolve subject names
        const subjects = await prisma.subject.findMany({
            where: { id: { in: gradeStats.map(s => s.subjectId) } },
            select: { id: true, name: true }
        });

        const performanceBySubject = gradeStats.map(s => ({
            name: subjects.find(sub => sub.id === s.subjectId)?.name || 'Unknown',
            avg: s._avg.score,
            count: s._count.id
        }));

        // 4. Summary Metrics for Director Pulse
        const totalAttendance = await prisma.attendanceRecord.count({
            where: { class: { grade: { schoolId: dbUser.schoolId } } }
        });
        const presentAttendance = await prisma.attendanceRecord.count({
            where: {
                class: { grade: { schoolId: dbUser.schoolId } },
                status: { in: ['PRESENT', 'LATE'] }
            }
        });

        const totalExams = await prisma.exam.count({
            where: { class: { grade: { schoolId: dbUser.schoolId } } }
        });
        const lockedExams = await prisma.exam.count({
            where: {
                class: { grade: { schoolId: dbUser.schoolId } },
                isLocked: true
            }
        });

        const recentEvents = await prisma.event.count({
            where: { schoolId: dbUser.schoolId, eventDate: { gte: sevenDaysAgo } }
        });

        const studentCount = await prisma.student.count({
            where: { schoolId: dbUser.schoolId }
        });
        const classCount = await prisma.class.count({
            where: { grade: { schoolId: dbUser.schoolId } }
        });

        const summary = {
            avgAttendance: totalAttendance > 0 ? `${((presentAttendance / totalAttendance) * 100).toFixed(1)}%` : "100%",
            examCompletion: totalExams > 0 ? `${((lockedExams / totalExams) * 100).toFixed(0)}%` : "0%",
            totalExams,
            lockedExams,
            recentEvents,
            studentCount,
            classCount,
            activeNodes: studentCount + classCount
        };

        // 3. Teacher Workload (Assignments count)
        const teacherWorkload = await prisma.user.findMany({
            where: { schoolId: dbUser.schoolId, role: 'TEACHER' },
            select: {
                name: true,
                _count: {
                    select: { teacherAssignments: true, timetable: true }
                }
            }
        });

        return NextResponse.json({
            summary,
            attendance,
            performanceBySubject,
            teacherWorkload: teacherWorkload.map(t => ({
                name: t.name,
                assignments: t._count.teacherAssignments,
                periods: t._count.timetable
            }))
        });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }
}
