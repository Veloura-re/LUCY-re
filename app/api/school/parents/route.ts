import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });
    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    try {
        const parents = await prisma.user.findMany({
            where: {
                schoolId: dbUser.schoolId,
                role: 'PARENT'
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                parentLinks: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            },
            orderBy: { name: 'asc' }
        });

        return NextResponse.json({ parents });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch parents' }, { status: 500 });
    }
}
