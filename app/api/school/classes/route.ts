import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    try {
        const grades = await prisma.grade.findMany({
            where: { schoolId: dbUser.schoolId },
            include: {
                classes: {
                    include: {
                        homeroomTeacher: { select: { id: true, name: true, email: true } },
                        _count: { select: { students: true } }
                    },
                    orderBy: { name: 'asc' }
                }
            },
            orderBy: { level: 'asc' }
        });

        return NextResponse.json({ grades });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 });
    }
}

export async function PATCH(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    try {
        const { classId, homeroomTeacherId } = await request.json();

        const updatedClass = await prisma.class.update({
            where: { id: classId },
            data: { homeroomTeacherId }
        });

        // Role Transition Logic:
        // 1. If a new teacher is assigned, ensure they have the HOMEROOM role
        if (homeroomTeacherId) {
            await prisma.user.update({
                where: { id: homeroomTeacherId },
                data: { role: 'HOMEROOM' }
            });
        }

        // 2. Cleanup: Any user with HOMEROOM role who is NOT a homeroom teacher for any class anymore
        // should be reverted to TEACHER.
        const homeroomUsers = await prisma.user.findMany({
            where: { role: 'HOMEROOM', schoolId: dbUser.schoolId },
            include: { homeroomClasses: true } // Assuming we add this relation to User, or we can check Class table
        });

        // Actually, let's just do a clean check against the Class table for efficiency
        const activeHomeroomTeachers = await prisma.class.findMany({
            where: { NOT: { homeroomTeacherId: null } },
            select: { homeroomTeacherId: true }
        });
        const activeIds = new Set(activeHomeroomTeachers.map(c => c.homeroomTeacherId));

        const teachersToRevert = await prisma.user.findMany({
            where: { role: 'HOMEROOM', id: { notIn: Array.from(activeIds) as string[] } }
        });

        for (const teacher of teachersToRevert) {
            await prisma.user.update({
                where: { id: teacher.id },
                data: { role: 'TEACHER' }
            });
        }

        return NextResponse.json({ success: true, class: updatedClass });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to update class' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    const body = await request.json();
    const { type, name, level, gradeId } = body;

    try {
        if (type === 'GRADE') {
            const grade = await prisma.grade.create({
                data: {
                    schoolId: dbUser.schoolId,
                    name,
                    level: parseInt(level),
                }
            });
            return NextResponse.json({ grade });
        } else if (type === 'CLASS') {
            const cls = await prisma.class.create({
                data: {
                    gradeId,
                    name,
                }
            });
            return NextResponse.json({ cls });
        }
        return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    const { id, type } = await request.json();

    try {
        if (type === 'CLASS') {
            await prisma.class.delete({ where: { id } });
        } else if (type === 'GRADE') {
            await prisma.grade.delete({ where: { id } });
        } else {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }
        return NextResponse.json({ success: true });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 });
    }
}
