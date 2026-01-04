import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { classId, subjectId, title, date, maxScore, questions } = await request.json();

    try {
        const exam = await prisma.exam.create({
            data: {
                title,
                classId,
                subjectId,
                createdById: user.id,
                questions: questions ?? [],
                dueAt: date ? new Date(date) : undefined,
                config: { maxScore: parseInt(maxScore) || 100 }
            }
        });
        return NextResponse.json({ exam });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create exam' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) return NextResponse.json({ error: 'Class ID required' }, { status: 400 });

    try {
        const exams = await prisma.exam.findMany({
            where: { classId },
            include: {
                gradeRecords: true,
                subject: true
            },
            orderBy: { dueAt: 'desc' }
        });
        return NextResponse.json({ exams });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch exams' }, { status: 500 });
    }
}
