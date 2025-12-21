import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const { key } = await request.json();

        if (!key) {
            return NextResponse.json({ error: 'Deployment key is required' }, { status: 400 });
        }

        const invite = await prisma.inviteToken.findUnique({
            where: { token: key },
        });

        if (!invite) {
            return NextResponse.json({ error: 'Invalid deployment key' }, { status: 404 });
        }

        const school = invite.schoolId
            ? await prisma.school.findUnique({ where: { id: invite.schoolId }, select: { name: true } })
            : null;

        if (invite.usedAt) {
            return NextResponse.json({ error: 'This key has already been used' }, { status: 400 });
        }

        if (invite.expiresAt < new Date()) {
            return NextResponse.json({ error: 'This key has expired' }, { status: 400 });
        }

        if (invite.role !== 'PRINCIPAL') {
            return NextResponse.json({ error: 'This key is not for a Director account' }, { status: 403 });
        }

        return NextResponse.json({
            valid: true,
            schoolName: school?.name || 'New School',
            email: invite.email
        });

    } catch (error: any) {
        console.error('Validation Error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
