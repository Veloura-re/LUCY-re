import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const { userId, email, name, studentCode } = await request.json();

    try {
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    id: userId,
                    email,
                    name,
                    role: 'PARENT',
                    verified: true,
                }
            });

            // 2. Link Student if code provided
            let link = null;
            if (studentCode) {
                const student = await tx.student.findUnique({
                    where: { studentCode }
                });

                if (student) {
                    link = await tx.parentStudentLink.create({
                        data: {
                            parentId: user.id,
                            studentId: student.id,
                            pairingMethod: 'CODE'
                        }
                    });

                    // ---------------------------------------------------------
                    // ADD TO WHOLE SCHOOL CHAT
                    // ---------------------------------------------------------
                    // 1. Find or Create "Whole School" Chat Room
                    let wholeSchoolChat = await tx.chatRoom.findFirst({
                        where: {
                            schoolId: student.schoolId,
                            name: "Whole School",
                            type: "GROUP"
                        }
                    });

                    if (!wholeSchoolChat) {
                        wholeSchoolChat = await tx.chatRoom.create({
                            data: {
                                schoolId: student.schoolId,
                                name: "Whole School",
                                type: "GROUP",
                            }
                        });
                    }

                    // 2. Add User to Chat Room
                    // Check if already member (unlikely for new user but good practice)
                    const existingMember = await tx.chatRoomMember.findUnique({
                        where: {
                            chatRoomId_userId: {
                                chatRoomId: wholeSchoolChat.id,
                                userId: user.id
                            }
                        }
                    });

                    if (!existingMember) {
                        await tx.chatRoomMember.create({
                            data: {
                                chatRoomId: wholeSchoolChat.id,
                                userId: user.id
                            }
                        });
                    }
                }
            }

            return { user, link };
        });

        return NextResponse.json(result);
    } catch (e: any) {
        console.error("Parent Registration Error:", e);
        // If user creation fails (e.g. duplicate), we return 500. 
        // In real app, handle P2002 explicitly.
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
