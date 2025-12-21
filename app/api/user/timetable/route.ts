import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole } from '@/lib/security';

export async function GET(request: Request) {
    try {
        const user = await requireRole(['TEACHER', 'HOMEROOM', 'STUDENT', 'PARENT']);
        const { searchParams } = new URL(request.url);
        const day = searchParams.get('day'); // Optional filter for specific day

        let where: any = {};

        if (user.role === 'TEACHER' || user.role === 'HOMEROOM') {
            where.teacherId = user.id;
        } else if (user.role === 'STUDENT') {
            const student = await prisma.student.findUnique({
                where: { userId: user.id }
            });
            if (!student?.classId) return NextResponse.json({ timetable: [] });
            where.classId = student.classId;
        } else if (user.role === 'PARENT') {
            // If parent, they might have multiple children. 
            // This endpoint might need a childId param for parents.
            const childId = searchParams.get('childId');
            if (!childId) return NextResponse.json({ error: "childId required for parents" }, { status: 400 });

            const student = await prisma.student.findUnique({ where: { id: childId } });
            if (!student?.classId) return NextResponse.json({ timetable: [] });
            where.classId = student.classId;
        }

        if (day) where.dayOfWeek = day;

        const timetable = await prisma.timetable.findMany({
            where,
            include: {
                class: true,
                subject: true,
                teacher: true,
                period: true
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { period: { order: 'asc' } }
            ]
        });

        return NextResponse.json({ timetable });
    } catch (e) {
        return handleApiError(e);
    }
}
