import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { schoolId: true, role: true }
    });

    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    const school = await prisma.school.findUnique({
        where: { id: dbUser.schoolId },
        select: { attendanceConfig: true }
    });

    return NextResponse.json({ config: school?.attendanceConfig });
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { schoolId: true, role: true }
    });

    if (!dbUser?.schoolId || (dbUser.role !== 'PRINCIPAL' && dbUser.role !== 'SUPERADMIN')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = await request.json();

    try {
        const updated = await prisma.school.update({
            where: { id: dbUser.schoolId },
            data: { attendanceConfig: config }
        });
        return NextResponse.json({ config: updated.attendanceConfig });
    } catch (e) {
        console.error("Config update error:", e);
        return NextResponse.json({ error: 'Failed to update configuration' }, { status: 500 });
    }
}
