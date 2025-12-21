import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.length < 2) return NextResponse.json({ users: [] });

    try {
        const currentUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!currentUser?.schoolId) return NextResponse.json({ users: [] });

        const whereClause: any = {
            schoolId: currentUser.schoolId,
            name: { contains: query, mode: 'insensitive' },
            id: { not: user.id }
        };

        // Students cannot see other students in search (to prevent direct messaging)
        if (currentUser.role === 'STUDENT') {
            whereClause.role = { not: 'STUDENT' };
        }

        // Parents cannot see other parents
        if (currentUser.role === 'PARENT') {
            whereClause.role = { not: 'PARENT' };
        }

        const users = await prisma.user.findMany({
            where: whereClause,
            select: { id: true, name: true, role: true, bio: true },
            take: 10
        });

        return NextResponse.json({ users });
    } catch (e) {
        return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
}
