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
        // 1. Attendance Trends (Last 7 Days - Normalized)
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            d.setHours(0, 0, 0, 0);
            days.push(d);
        }

        const attendanceData = await Promise.all(days.map(async (day) => {
            const nextDay = new Date(day);
            nextDay.setDate(nextDay.getDate() + 1);

            const counts = await (prisma.attendanceRecord as any).groupBy({
                by: ['status'],
                where: {
                    class: { grade: { schoolId: dbUser.schoolId as string } },
                    date: {
                        gte: day,
                        lt: nextDay
                    }
                },
                _count: { id: true }
            }) as any[];

            const present = counts.find((c: any) => c.status === 'PRESENT' || c.status === 'LATE')?._count?.id || 0;
            const absent = counts.find((c: any) => c.status === 'ABSENT')?._count?.id || 0;
            const total = present + absent;

            return {
                date: day.toISOString(),
                percentage: total > 0 ? (present / total) * 100 : 100,
                total
            };
        }));

        // 2. Grade Distribution (Mean scores per subject)
        const gradeStats = await (prisma.gradeRecord as any).groupBy({
            by: ['subjectId'],
            where: {
                subject: { schoolId: dbUser.schoolId as string }
            },
            _avg: { score: true },
            _count: { id: true }
        }) as any[];

        // Resolve subject names
        const subjects = await prisma.subject.findMany({
            where: { id: { in: gradeStats.map(s => s.subjectId) } },
            select: { id: true, name: true }
        });

        const performanceBySubject = gradeStats.map(s => ({
            name: subjects.find(sub => sub.id === s.subjectId)?.name || 'Unknown',
            avg: s._avg.score || 0,
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

        const lastSevenDays = days[0];

        const recentEvents = await prisma.event.count({
            where: { schoolId: dbUser.schoolId, eventDate: { gte: lastSevenDays } }
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
            attendance: attendanceData,
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
