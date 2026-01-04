import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const { token, userId, name, email } = await request.json();

    // Validate Token again in transaction
    try {
        const result = await prisma.$transaction(async (tx) => {
            const invite = await tx.inviteToken.findUnique({
                where: { token },
            });

            if (!invite || invite.usedAt || invite.expiresAt < new Date()) {
                throw new Error("Invalid Token");
            }

            // Create User Record
            const user = await tx.user.create({
                data: {
                    id: userId, // Match Supabase ID
                    email: invite.email,
                    name,
                    role: invite.role, // Use role from token
                    verified: true,
                    schoolId: invite.schoolId,
                }
            });

            // Update School Status if needed and if schoolId exists
            if (invite.schoolId) {
                // Check if school exists first or just update. 
                // If it's a teacher invite, school is already ACTIVE probably.
                // Only if PRINCIPAL invite and school is PENDING should we activate?
                // Or just ensure ACTIVE is fine.
                await tx.school.update({
                    where: { id: invite.schoolId },
                    data: { status: 'ACTIVE' }
                });

                // ---------------------------------------------------------
                // ADD TO WHOLE SCHOOL CHAT
                // ---------------------------------------------------------
                // 1. Find or Create "Whole School" Chat Room
                let wholeSchoolChat = await tx.chatRoom.findFirst({
                    where: {
                        schoolId: invite.schoolId,
                        name: "Whole School",
                        type: "GROUP"
                    }
                });

                if (!wholeSchoolChat) {
                    wholeSchoolChat = await tx.chatRoom.create({
                        data: {
                            schoolId: invite.schoolId,
                            name: "Whole School",
                            type: "GROUP",
                        }
                    });
                }

                // 2. Add User to Chat Room
                await tx.chatRoomMember.create({
                    data: {
                        chatRoomId: wholeSchoolChat.id,
                        userId: user.id
                    }
                });
            }

            // Burn Token
            await tx.inviteToken.update({
                where: { id: invite.id },
                data: { usedAt: new Date() }
            });

            return user;
        });

        return NextResponse.json({ success: true, userId: result.id });

    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 400 });
    }
}
