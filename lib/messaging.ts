import { prisma } from '@/lib/prisma';
import { ChatRoomType, Role } from '@prisma/client';

/**
 * Ensures a user is a member of the default school-wide group chats.
 */
export async function syncGroupMemberships(userId: string, schoolId: string, role: Role) {
    // 1. Ensure "School Group" exists
    let schoolRoom = await prisma.chatRoom.findFirst({
        where: {
            schoolId,
            type: ChatRoomType.GROUP,
            name: 'School Group'
        }
    });

    if (!schoolRoom) {
        schoolRoom = await prisma.chatRoom.create({
            data: {
                schoolId,
                type: ChatRoomType.GROUP,
                name: 'School Group',
                metadata: { description: 'General announcements and discussions for everyone.' }
            }
        });
    }

    // Add user to School Group
    await prisma.chatRoomMember.upsert({
        where: { chatRoomId_userId: { chatRoomId: schoolRoom.id, userId } },
        update: {},
        create: { chatRoomId: schoolRoom.id, userId }
    });

    // 2. Ensure "Teachers-Only Group" exists if user is staff
    if (role === Role.TEACHER || role === Role.HOMEROOM || role === Role.PRINCIPAL || role === Role.SUPERADMIN) {
        let facultyRoom = await prisma.chatRoom.findFirst({
            where: {
                schoolId,
                type: ChatRoomType.GROUP,
                name: 'Teachers-Only Group'
            }
        });

        if (!facultyRoom) {
            facultyRoom = await prisma.chatRoom.create({
                data: {
                    schoolId,
                    type: ChatRoomType.GROUP,
                    name: 'Teachers-Only Group',
                    metadata: { description: 'Private space for staff coordination and planning.' }
                }
            });
        }

        // Add user to Teachers Group
        await prisma.chatRoomMember.upsert({
            where: { chatRoomId_userId: { chatRoomId: facultyRoom.id, userId } },
            update: {},
            create: { chatRoomId: facultyRoom.id, userId }
        });
    }
}

/**
 * Finds or creates a private 1-on-1 chat room between two users.
 */
export async function getOrCreatePrivateRoom(schoolId: string, userAId: string, userBId: string) {
    // Check if they are already in a private room together
    const existingRoom = await prisma.chatRoom.findFirst({
        where: {
            schoolId,
            type: ChatRoomType.PRIVATE,
            members: { some: { userId: userAId } },
            AND: {
                members: { some: { userId: userBId } }
            }
        }
    });

    if (existingRoom) return existingRoom;

    // Create new private room
    return await prisma.chatRoom.create({
        data: {
            schoolId,
            type: ChatRoomType.PRIVATE,
            members: {
                create: [
                    { userId: userAId },
                    { userId: userBId }
                ]
            }
        }
    });
}
