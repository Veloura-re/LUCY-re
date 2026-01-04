import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const links = await prisma.parentStudentLink.findMany({
            where: { parentId: user.id },
            include: {
                student: {
                    include: {
                        grade: true,
                        school: true,
                        class: {
                            include: {
                                homeroomTeacher: true
                            }
                        }
                    }
                }
            }
        });

        const students = await Promise.all(links.map(async (link) => {
            const principal = await prisma.user.findFirst({
                where: { schoolId: link.student.schoolId, role: 'PRINCIPAL' },
                select: { id: true, name: true }
            });

            // Calculate Attendance
            const present = await prisma.attendanceRecord.count({
                where: { studentId: link.student.id, status: 'PRESENT' }
            });
            const totalAttendance = await prisma.attendanceRecord.count({
                where: { studentId: link.student.id }
            });
            const attendancePct = totalAttendance > 0 ? (present / totalAttendance) * 100 : 100;

            // Calculate "Average Score" (GPA proxy)
            const grades = await prisma.gradeRecord.findMany({
                where: { studentId: link.student.id, exam: { isPublished: true } as any },
                include: { exam: true }
            }) as any[];

            let averageScore = 0;
            if (grades.length > 0) {
                const total = grades.reduce((acc, g) => {
                    const max = (g.exam?.config as any)?.maxScore || 100;
                    return acc + (g.score / max);
                }, 0);
                averageScore = (total / grades.length) * 100;
            }

            return {
                ...link.student,
                principal,
                stats: {
                    attendancePct: attendancePct.toFixed(1),
                    averageScore: averageScore.toFixed(1)
                }
            };
        }));

        return NextResponse.json({ students });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}
