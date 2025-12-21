import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { student: true }
    });

    if (!dbUser?.student) return NextResponse.json({ error: 'No student profile' }, { status: 400 });

    try {
        const records = await prisma.gradeRecord.findMany({
            where: { studentId: dbUser.student.id },
            include: {
                exam: true,
                subject: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Group by Subject
        const grouped: any = {};
        records.forEach(r => {
            if (!grouped[r.subjectId]) {
                grouped[r.subjectId] = {
                    subjectId: r.subjectId,
                    subjectName: r.subject.name,
                    exams: [],
                    totalScore: 0,
                    totalMax: 0
                };
            }
            // If exam linked, use exam config for max score, else 100
            const max = r.exam?.config ? (r.exam.config as any).maxScore || 100 : 100;

            grouped[r.subjectId].exams.push({
                id: r.id,
                title: r.exam?.title || "Assignment",
                date: r.createdAt,
                score: r.score,
                maxScore: max
            });

            grouped[r.subjectId].totalScore += Number(r.score);
            grouped[r.subjectId].totalMax += Number(max);
        });

        const result = Object.values(grouped).map((g: any) => ({
            ...g,
            average: g.totalMax > 0 ? (g.totalScore / g.totalMax) * 100 : 0
        }));

        return NextResponse.json({ grouped: result });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch grades' }, { status: 500 });
    }
}
