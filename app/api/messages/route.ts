import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const chatRoomId = searchParams.get('chatRoomId');

    if (!chatRoomId) {
        return NextResponse.json({ error: 'Chat Room ID is required' }, { status: 400 });
    }

    try {
        // Verify membership
        const membership = await prisma.chatRoomMember.findUnique({
            where: { chatRoomId_userId: { chatRoomId, userId: authUser.id } }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden: You are not a member of this room' }, { status: 403 });
        }

        const messages = await prisma.message.findMany({
            where: { chatRoomId },
            include: {
                fromUser: {
                    select: { id: true, name: true, role: true }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return NextResponse.json({ messages });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const { chatRoomId, content, attachments } = await request.json();

        if (!chatRoomId || (!content && !attachments)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify membership and fetch room/school context
        const membership = await prisma.chatRoomMember.findUnique({
            where: { chatRoomId_userId: { chatRoomId, userId: authUser.id } },
            include: { chatRoom: true }
        });

        if (!membership) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const message = await prisma.message.create({
            data: {
                chatRoomId,
                fromUserId: authUser.id,
                schoolId: membership.chatRoom.schoolId,
                content: content || '',
                attachments: attachments || null
            },
            include: {
                fromUser: {
                    select: { id: true, name: true, role: true }
                }
            }
        });

        // Update room's updatedAt for sorting
        await prisma.chatRoom.update({
            where: { id: chatRoomId },
            data: { updatedAt: new Date() }
        });

        return NextResponse.json({ message });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
