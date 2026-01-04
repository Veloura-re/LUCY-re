import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { syncGroupMemberships, getOrCreatePrivateRoom } from '@/lib/messaging';
import { ChatRoomType } from '@prisma/client';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user: authUser } } = await supabase.auth.getUser();

    if (!authUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: authUser.id },
            include: { school: true }
        });

        if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

        // Auto-sync memberships on login/access
        await syncGroupMemberships(dbUser.id, dbUser.schoolId, dbUser.role);

        // Fetch all rooms the user is a member of
        const rooms = await prisma.chatRoom.findMany({
            where: {
                schoolId: dbUser.schoolId,
                members: { some: { userId: dbUser.id } }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, name: true, role: true, bio: true }
                        }
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    include: {
                        fromUser: { select: { name: true } }
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        });

        // Calculate unread counts and format
        const roomsWithMeta = await Promise.all(rooms.map(async (room: any) => {
            const myMembership = room.members.find((m: any) => m.userId === dbUser.id);
            const unreadCount = await prisma.message.count({
                where: {
                    chatRoomId: room.id,
                    createdAt: { gt: myMembership?.lastReadAt }
                }
            });

            // For private chats, identify the 'partner'
            let partner = null;
            if (room.type === ChatRoomType.PRIVATE) {
                const partnerMember = room.members.find((m: any) => m.userId !== dbUser.id);
                partner = partnerMember?.user || null;

                // SPECIAL LOGIC: Rename PARENT if viewed by STAFF
                if (partner && partner.role === 'PARENT' && dbUser.role !== 'PARENT' && dbUser.role !== 'STUDENT') {
                    const children = await prisma.parentStudentLink.findMany({
                        where: { parentId: partner.id },
                        include: { student: true }
                    });
                    if (children.length > 0) {
                        const childNames = children.map(c => c.student.firstName).join(', ');
                        partner = {
                            ...partner,
                            name: `${childNames}'s Parent (${partner.name})`
                        };
                    }
                }
            }

            return {
                ...room,
                unreadCount,
                partner
            };
        }));

        return NextResponse.json({ rooms: roomsWithMeta });
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
        const { targetUserId } = await request.json();
        const dbUser = await prisma.user.findUnique({ where: { id: authUser.id } });

        if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

        // Handle private chat creation
        if (targetUserId) {
            // Permission checks
            const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } });
            if (!targetUser) return NextResponse.json({ error: 'Target user not found' }, { status: 404 });

            // Implementation of Rules:
            // Students cannot message other students
            if (dbUser.role === 'STUDENT' && targetUser.role === 'STUDENT') {
                return NextResponse.json({ error: 'Restricted: Students cannot message other students.' }, { status: 403 });
            }

            // Parents can only message staff
            if (dbUser.role === 'PARENT' && targetUser.role === 'PARENT') {
                return NextResponse.json({ error: 'Restricted: Parents cannot message other parents.' }, { status: 403 });
            }

            const room = await getOrCreatePrivateRoom(dbUser.schoolId, dbUser.id, targetUserId);
            return NextResponse.json({ room });
        }

        return NextResponse.json({ error: 'Action not supported' }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
