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

    if (!['PRINCIPAL', 'SUPERADMIN'].includes(dbUser.role)) {
        return NextResponse.json({ error: 'Unauthorized role' }, { status: 403 });
    }

    try {
        const { classId, homeroomTeacherId } = await request.json();

        // Ensure the class belongs to this school
        const targetClass = await prisma.class.findUnique({
            where: { id: classId },
            include: { grade: true }
        });

        if (!targetClass || targetClass.grade.schoolId !== dbUser.schoolId) {
            return NextResponse.json({ error: 'Class not found' }, { status: 404 });
        }

        // Ensure the teacher exists and belongs to this school
        if (homeroomTeacherId) {
            const targetTeacher = await prisma.user.findUnique({
                where: { id: homeroomTeacherId }
            });

            if (!targetTeacher || targetTeacher.schoolId !== dbUser.schoolId) {
                return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
            }

            // Check if teacher is already assigned to ANOTHER class
            const existingAssignment = await prisma.class.findFirst({
                where: {
                    homeroomTeacherId,
                    id: { not: classId },
                    grade: { schoolId: dbUser.schoolId }
                }
            });

            if (existingAssignment) {
                return NextResponse.json({ error: 'Teacher is already assigned to another class' }, { status: 400 });
            }
        }

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

        // 2. Cleanup: Any user with HOMEROOM role in this school who is NOT a homeroom teacher anymore
        const activeHomeroomTeachers = await prisma.class.findMany({
            where: {
                NOT: { homeroomTeacherId: null },
                grade: { schoolId: dbUser.schoolId }
            },
            select: { homeroomTeacherId: true }
        });
        const activeIds = new Set(activeHomeroomTeachers.map(c => (c.homeroomTeacherId as string)));

        const teachersToRevert = await prisma.user.findMany({
            where: {
                role: 'HOMEROOM',
                schoolId: dbUser.schoolId,
                id: { notIn: Array.from(activeIds) }
            }
        });

        for (const teacher of teachersToRevert) {
            await prisma.user.update({
                where: { id: teacher.id },
                data: { role: 'TEACHER' }
            });
        }

        return NextResponse.json({ success: true, class: updatedClass });
    } catch (e) {
        console.error("Error updating class:", e);
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
