import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole } from '@/lib/security';

export async function GET(request: Request) {
    try {
        const user = await requireRole(['STUDENT', 'PARENT']);
        const { searchParams } = new URL(request.url);
        let studentId = '';

        if (user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({ where: { userId: user.id } });
            if (!student) return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
            studentId = student.id;
        } else {
            const childId = searchParams.get('childId');
            if (!childId) return NextResponse.json({ error: 'childId required' }, { status: 400 });
            studentId = childId;
        }

        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: {
                class: {
                    include: {
                        teacherAssignments: {
                            include: { subject: true, teacher: true }
                        }
                    }
                }
            }
        });

        if (!student) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

        // 1. Fetch Grades
        const grades = await prisma.gradeRecord.findMany({
            where: { studentId },
            include: { subject: true }
        });

        // 2. Fetch Attendance Summary
        const attendance = await prisma.attendanceRecord.findMany({
            where: { studentId },
            select: { status: true }
        });

        const presentCount = attendance.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
        const totalAttendance = attendance.length;
        const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 100;

        // 3. Aggregate by Subject
        const subjectStats = student.class?.teacherAssignments.map(a => {
            const subGrades = grades.filter(g => g.subjectId === a.subjectId);
            const avgGrade = subGrades.length > 0
                ? subGrades.reduce((acc, g) => acc + Number(g.score), 0) / subGrades.length
                : 0;

            return {
                name: a.subject.name,
                teacher: a.teacher.name,
                avgGrade,
                gradeLabel: avgGrade >= 90 ? 'A' : avgGrade >= 80 ? 'B' : avgGrade >= 70 ? 'C' : 'D'
            };
        }) || [];

        // 4. Find Next Session
        const now = new Date();
        const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
        const currentDay = days[now.getDay()];
        const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');

        if (!student.classId) return NextResponse.json({
            studentName: `${student.firstName} ${student.lastName}`,
            attendanceRate,
            subjectStats,
            gpa: (subjectStats.reduce((acc, s) => acc + s.avgGrade, 0) / (subjectStats.length || 1) / 25).toFixed(1),
            nextSession: null
        });

        const timetable = await prisma.timetable.findMany({
            where: {
                classId: student.classId,
                dayOfWeek: currentDay as any
            },
            include: {
                period: true,
                subject: true
            },
            orderBy: { period: { startTime: 'asc' } }
        });

        const nextSession = (timetable as any[]).find(slot => slot.period.startTime > currentTime) || null;

        return NextResponse.json({
            studentName: `${student.firstName} ${student.lastName}`,
            attendanceRate,
            subjectStats,
            gpa: (subjectStats.reduce((acc, s) => acc + s.avgGrade, 0) / (subjectStats.length || 1) / 25).toFixed(1), // Fake GPA scaling
            nextSession: nextSession ? {
                subjectName: nextSession.subject.name,
                startTime: nextSession.period.startTime,
                room: "Sector B-04", // Placeholder room for now
                startsIn: nextSession ? Math.max(0, (parseInt(nextSession.period.startTime.split(':')[0]) * 60 + parseInt(nextSession.period.startTime.split(':')[1])) - (now.getHours() * 60 + now.getMinutes())) : null
            } : null
        });

    } catch (e) {
        return handleApiError(e);
    }
}
