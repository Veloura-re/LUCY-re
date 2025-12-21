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
        const records = await prisma.attendanceRecord.findMany({
            where: { studentId: dbUser.student.id },
            orderBy: { date: 'desc' }
        });

        // Calculate stats
        const total = records.length;
        const present = records.filter(r => r.status === 'PRESENT').length;
        const late = records.filter(r => r.status === 'LATE').length;
        const absent = records.filter(r => r.status === 'ABSENT').length;
        const excused = records.filter(r => r.status === 'EXCUSED').length;

        const percentage = total > 0 ? ((present + late) / total) * 100 : 100;

        return NextResponse.json({
            records,
            stats: { total, present, late, absent, excused, percentage }
        });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch attendance' }, { status: 500 });
    }
}
