import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school found' }, { status: 400 });

        // Auto-delete past events (events that have already occurred)
        const now = new Date();
        await prisma.event.deleteMany({
            where: {
                schoolId: dbUser.schoolId,
                eventDate: { lt: now }
            }
        });

        // Fetch remaining (future) events
        const events = await prisma.event.findMany({
            where: { schoolId: dbUser.schoolId },
            orderBy: { eventDate: 'asc' },
            include: { createdBy: { select: { name: true, role: true } } }
        });

        return NextResponse.json({ events });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
        if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school found' }, { status: 400 });

        // Only Staff can create events
        if (!['SUPERADMIN', 'PRINCIPAL', 'TEACHER', 'HOMEROOM'].includes(dbUser.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { title, description, date } = await request.json();

        const event = await prisma.event.create({
            data: {
                title,
                description,
                eventDate: new Date(date),
                schoolId: dbUser.schoolId,
                createdById: user.id
            }
        });

        return NextResponse.json({ event });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    try {
        await prisma.event.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete event' }, { status: 500 });
    }
}
