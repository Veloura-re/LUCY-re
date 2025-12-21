import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole } from '@/lib/security';

export async function GET(request: Request) {
    try {
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL', 'TEACHER', 'HOMEROOM']);

        const { searchParams } = new URL(request.url);
        const classId = searchParams.get('classId');

        const periods = await prisma.period.findMany({
            where: {
                schoolId: user.schoolId!,
                classId: classId || null
            },
            orderBy: { order: 'asc' }
        });

        return NextResponse.json({ periods });
    } catch (e) {
        return handleApiError(e);
    }
}

export async function POST(request: Request) {
    try {
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL']);
        const { periods, classId } = await request.json(); // Array of { name, startTime, endTime, isBreak, order, id? }

        if (!Array.isArray(periods)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const schoolId = user.schoolId!;

        // Use a transaction to ensure clean update
        const result = await prisma.$transaction(async (tx) => {
            // Delete existing for this school/class
            await tx.period.deleteMany({
                where: {
                    schoolId,
                    classId: classId || null
                }
            });

            // Create new ones
            const created = await Promise.all(periods.map(p =>
                tx.period.create({
                    data: {
                        schoolId,
                        classId: classId || null,
                        name: p.name,
                        startTime: p.startTime,
                        endTime: p.endTime,
                        isBreak: p.isBreak || false,
                        order: p.order || 0
                    }
                })
            ));
            return created;
        });

        return NextResponse.json({ success: true, count: result.length, periods: result });
    } catch (e) {
        return handleApiError(e);
    }
}
