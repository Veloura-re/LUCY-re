import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';

// PATCH - Update school status (suspend/activate)
export async function PATCH(
    request: Request,
    { params }: { params: { id: string } }
) {
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

    const { id } = await params;
    const { status } = await request.json();

    if (!['ACTIVE', 'SUSPENDED', 'PENDING'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    try {
        const school = await prisma.school.update({
            where: { id },
            data: { status }
        });

        return NextResponse.json({ school });
    } catch (error) {
        console.error("Error updating school:", error);
        return NextResponse.json({ error: 'Failed to update school' }, { status: 500 });
    }
}

// DELETE - Delete school and all related data
export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
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

    const { id } = await params;

    try {
        // Delete school (cascades will handle related data based on schema)
        await prisma.school.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting school:", error);
        return NextResponse.json({ error: 'Failed to delete school' }, { status: 500 });
    }
}
