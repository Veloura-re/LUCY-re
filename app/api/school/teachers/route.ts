import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    try {
        // 1. Get Active Teachers
        const teachers = await prisma.user.findMany({
            where: {
                schoolId: dbUser.schoolId,
                role: { in: ['TEACHER', 'HOMEROOM'] }
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
            }
        });

        const formattedActive = teachers.map(t => ({
            ...t,
            status: 'ACTIVE'
        }));

        // 2. Get Pending Invites
        const invites = await prisma.inviteToken.findMany({
            where: {
                schoolId: dbUser.schoolId,
                role: 'TEACHER',
                usedAt: null
            }
        });

        const formattedInvites = invites.map(i => ({
            id: i.id,
            name: null,
            email: i.email,
            createdAt: i.createdAt,
            status: 'PENDING'
        }));

        // Combine and sort by date desc
        const all = [...formattedActive, ...formattedInvites].sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        return NextResponse.json({ teachers: all });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch teachers' }, { status: 500 });
    }
}
