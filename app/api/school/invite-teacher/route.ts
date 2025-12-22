import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import { sendInviteEmail } from '@/lib/email';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { school: true }
    });

    if (dbUser?.role !== 'PRINCIPAL' || !dbUser.schoolId || !dbUser.school) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await request.json();
    const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    try {
        await prisma.inviteToken.create({
            data: {
                token,
                email,
                role: 'TEACHER', // Fixed as Teacher for this endpoint
                schoolId: dbUser.schoolId,
                expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48h
            }
        });

        // Send Email
        const origin = request.headers.get('origin') || 'http://localhost:3000';
        const inviteUrl = `${origin}/invite/${token}`;

        const emailResult = await sendInviteEmail(email, inviteUrl, dbUser.school.name, token, 'TEACHER');

        return NextResponse.json({
            token,
            sent: emailResult.success,
            simulated: emailResult.simulated || false,
            emailError: emailResult.error || null
        });
    } catch (e) {
        console.error("Invite Error:", e);
        return NextResponse.json({ error: 'Failed to create invite' }, { status: 500 });
    }
}
