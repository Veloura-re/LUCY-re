import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole } from '@/lib/security';

export async function GET() {
    try {
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL']);

        const school = await prisma.school.findUnique({
            where: { id: user.schoolId! },
            include: {
                _count: {
                    select: { students: true, users: true, grades: true }
                }
            }
        });

        return NextResponse.json({ school });
    } catch (e) {
        return handleApiError(e);
    }
}

export async function PATCH(request: Request) {
    try {
        const user = await requireRole(['SUPERADMIN', 'PRINCIPAL']);
        const { name, schoolCode } = await request.json();

        const school = await prisma.school.update({
            where: { id: user.schoolId! },
            data: {
                name,
                schoolCode
            }
        });

        return NextResponse.json({ school });
    } catch (e) {
        return handleApiError(e);
    }
}
