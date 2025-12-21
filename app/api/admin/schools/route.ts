import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

// GET - List all schools
export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { role: true }
    });

    if (dbUser?.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const schools = await prisma.school.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                _count: {
                    select: {
                        users: true,
                        students: true,
                        grades: true
                    }
                }
            }
        });

        return NextResponse.json({ schools });
    } catch (error) {
        console.error("Error fetching schools:", error);
        return NextResponse.json({ error: 'Failed to fetch schools' }, { status: 500 });
    }
}

// POST - Create school and invite director
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
    });

    if (dbUser?.role !== 'SUPERADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, directorEmail } = body;

    if (!name || !directorEmail) {
        return NextResponse.json({ error: 'Name and director email required' }, { status: 400 });
    }

    try {
        const result = await prisma.$transaction(async (tx) => {
            const school = await tx.school.create({
                data: {
                    name,
                    schoolCode: `SCH-${Date.now().toString().slice(-6)}`,
                    status: 'PENDING',
                },
            });

            const token = `inv_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

            await tx.inviteToken.create({
                data: {
                    token,
                    email: directorEmail,
                    role: 'PRINCIPAL',
                    schoolId: school.id,
                    expiresAt,
                },
            });

            return { school, token };
        });

        const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${result.token}`;

        // Send invite email
        const { sendInviteEmail } = await import('@/lib/email');
        const emailResult = await sendInviteEmail(directorEmail, inviteUrl, name, result.token);

        return NextResponse.json({
            school: result.school,
            inviteToken: result.token,
            inviteUrl,
            emailSent: emailResult.success,
            simulated: emailResult.simulated || false,
            emailError: emailResult.error || null
        });
    } catch (error) {
        console.error("Error creating school:", error);
        return NextResponse.json({ error: 'Failed to create school' }, { status: 500 });
    }
}
