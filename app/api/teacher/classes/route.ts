import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const assignments = await prisma.teacherAssignment.findMany({
            where: {
                teacherId: user.id
            },
            include: {
                class: {
                    include: {
                        grade: true,
                        _count: {
                            select: { students: true }
                        }
                    }
                },
                subject: true
            }
        });

        const classes = await Promise.all(assignments.map(async (a: any) => {
            const grades = await prisma.gradeRecord.aggregate({
                where: {
                    student: { classId: a.classId },
                    subjectId: a.subjectId
                },
                _avg: { score: true }
            });

            return {
                id: a.id,
                classId: a.classId,
                className: a.class.name,
                subjectId: a.subjectId,
                subjectName: a.subject.name,
                gradeLevel: a.class.grade.level,
                studentCount: a.class._count.students,
                avgGrade: grades._avg?.score || null
            };
        }));

        return NextResponse.json({ classes });
    } catch (e) {
        console.error("Failed to fetch teacher classes", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
