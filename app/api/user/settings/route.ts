import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                bio: true,
                preferences: true
            }
        });

        return NextResponse.json({ user });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { name, bio, preferences } = await request.json();

        const user = await prisma.user.update({
            where: { id: authUser.id },
            data: {
                name,
                bio,
                preferences
            }
        });

        return NextResponse.json({ user });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
