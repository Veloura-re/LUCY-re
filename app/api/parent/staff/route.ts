import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { Role } from '@prisma/client';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { schoolId: true, role: true }
        });

        if (!dbUser || dbUser.role !== Role.PARENT || !dbUser.schoolId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Fetch teachers and principals in the same school
        const staff = await prisma.user.findMany({
            where: {
                schoolId: dbUser.schoolId,
                role: { in: [Role.TEACHER, Role.HOMEROOM, Role.PRINCIPAL] },
                ...(query ? {
                    name: {
                        contains: query,
                        mode: 'insensitive'
                    }
                } : {})
            },
            select: {
                id: true,
                name: true,
                role: true,
                bio: true
            },
            take: 20
        });

        return NextResponse.json({ staff });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
