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

    // 3. Ensure Class-Specific Groups
    let classIds: string[] = [];

    if (role === Role.TEACHER || role === Role.HOMEROOM) {
        const assignments = await prisma.teacherAssignment.findMany({
            where: { teacherId: userId },
            select: { classId: true }
        });
        classIds = assignments.map(a => a.classId);
    } else if (role === Role.STUDENT) {
        const student = await prisma.student.findUnique({
            where: { userId },
            select: { classId: true }
        });
        if (student?.classId) classIds = [student.classId];
    } else if (role === Role.PARENT) {
        const parentLinks = await prisma.parentStudentLink.findMany({
            where: { parentId: userId },
            include: { student: { select: { classId: true } } }
        });
        classIds = parentLinks
            .map(l => l.student.classId)
            .filter((id): id is string => !!id);
    }

    // Process each class chat
    for (const classId of [...new Set(classIds)]) {
        const schoolClass = await prisma.class.findUnique({
            where: { id: classId },
            include: { grade: true }
        });

        if (!schoolClass) continue;

        const chatName = `Class: ${schoolClass.grade.name} ${schoolClass.name}`;

        let classRoom = await prisma.chatRoom.findFirst({
            where: {
                schoolId,
                type: ChatRoomType.GROUP,
                metadata: {
                    path: ['classId'],
                    equals: classId
                }
            }
        });

        if (!classRoom) {
            classRoom = await prisma.chatRoom.create({
                data: {
                    schoolId,
                    type: ChatRoomType.GROUP,
                    name: chatName,
                    metadata: {
                        classId,
                        description: `Official group for ${chatName}`
                    }
                }
            });
        }

        // Sync Membership
        await prisma.chatRoomMember.upsert({
            where: { chatRoomId_userId: { chatRoomId: classRoom.id, userId } },
            update: {},
            create: { chatRoomId: classRoom.id, userId }
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
