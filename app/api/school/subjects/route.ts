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
        const subjects = await prisma.subject.findMany({
            where: { schoolId: dbUser.schoolId },
            orderBy: { name: 'asc' }
        });
        return NextResponse.json({ subjects });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch subjects' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    const { name } = await request.json();

    try {
        const subject = await prisma.subject.create({
            data: {
                schoolId: dbUser.schoolId,
                name
            }
        });
        return NextResponse.json({ subject });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to create subject' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await request.json();

    try {
        await prisma.subject.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete subject' }, { status: 500 });
    }
}
