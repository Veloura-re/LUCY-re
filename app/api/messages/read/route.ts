import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { chatRoomId } = await request.json();

        if (!chatRoomId) return NextResponse.json({ error: 'Missing chatRoomId' }, { status: 400 });

        await prisma.chatRoomMember.update({
            where: {
                chatRoomId_userId: { chatRoomId, userId: authUser.id }
            },
            data: {
                lastReadAt: new Date()
            }
        });

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
