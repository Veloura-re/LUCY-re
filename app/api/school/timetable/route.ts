import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole } from '@/lib/security';

export async function GET(request: Request) {
    try {
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL', 'TEACHER', 'HOMEROOM', 'STUDENT', 'PARENT']);
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get('classId');
        const teacherId = searchParams.get('teacherId');

        if (!classId && !teacherId) {
            return NextResponse.json({ error: "classId or teacherId required" }, { status: 400 });
        }

        const where: any = {};
        if (classId) where.classId = classId;
        if (teacherId) where.teacherId = teacherId;

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

export async function POST(request: Request) {
    try {
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL']);
        const { classId, subjectId, teacherId, periodId, dayOfWeek } = await request.json();

        if (!classId || !subjectId || !teacherId || !periodId || !dayOfWeek) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // [CONFLICT CHECK] Is this teacher already teaching somewhere else during this period/day?
        const teacherConflict = await prisma.timetable.findFirst({
            where: {
                teacherId,
                periodId,
                dayOfWeek,
                NOT: { classId } // Ignore if updating the same class? Actually better to check all.
            },
            include: { class: true }
        });

        if (teacherConflict) {
            return NextResponse.json({
                error: `Teacher is already assigned to Class ${teacherConflict.class.name} during this period.`
            }, { status: 409 });
        }

        // Upsert the timetable slot
        const result = await prisma.timetable.upsert({
            where: {
                classId_periodId_dayOfWeek: {
                    classId,
                    periodId,
                    dayOfWeek
                }
            },
            update: {
                subjectId,
                teacherId
            },
            create: {
                classId,
                subjectId,
                teacherId,
                periodId,
                dayOfWeek
            }
        });

        return NextResponse.json({ success: true, entry: result });
    } catch (e) {
        return handleApiError(e);
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL']);
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

        await prisma.timetable.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return handleApiError(e);
    }
}
