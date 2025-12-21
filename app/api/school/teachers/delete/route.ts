import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser?.role !== 'PRINCIPAL' || !dbUser.schoolId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { email } = await request.json();

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    try {
        // Try to delete invite first
        const deletedInvite = await prisma.inviteToken.deleteMany({
            where: {
                email: email,
                schoolId: dbUser.schoolId
            }
        });

        // If no invite found, check if it's an active user and unlink/delete them? 
        // For now, let's just handle invites and maybe unlink teachers from school.
        // Unlinking user:
        if (deletedInvite.count === 0) {
            const teacher = await prisma.user.findFirst({
                where: { email: email, schoolId: dbUser.schoolId }
            });

            if (teacher) {
                await prisma.user.update({
                    where: { id: teacher.id },
                    data: { schoolId: null }
                });
            }
        }

        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}
