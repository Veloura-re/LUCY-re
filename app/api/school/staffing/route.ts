import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

// POST: Assign a teacher to a subject in a class
export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!dbUser?.schoolId) return NextResponse.json({ error: 'No school linked' }, { status: 400 });

    const { classId, subjectId, teacherId } = await request.json();

    try {
        // Check if assignment already exists
        const existing = await prisma.teacherAssignment.findFirst({
            where: {
                classId,
                subjectId,
            }
        });

        if (existing) {
            // Update existing assignment
            const updated = await prisma.teacherAssignment.update({
                where: { id: existing.id },
                data: { teacherId }
            });
            return NextResponse.json({ assignment: updated });
        } else {
            // Create new assignment
            const assignment = await prisma.teacherAssignment.create({
                data: {
                    classId,
                    subjectId,
                    teacherId
                }
            });
            return NextResponse.json({ assignment });
        }
    } catch (e) {
        console.error("Staffing error:", e);
        return NextResponse.json({ error: 'Failed to assign teacher' }, { status: 500 });
    }
}

// GET: Fetch assignments for a specific class
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('classId');

    if (!classId) return NextResponse.json({ error: 'Class ID required' }, { status: 400 });

    try {
        const assignments = await prisma.teacherAssignment.findMany({
            where: { classId },
            include: {
                teacher: { select: { id: true, name: true, email: true } },
                subject: true
            }
        });
        return NextResponse.json({ assignments });
    } catch (e) {
        return NextResponse.json({ error: 'Failed to fetch assignments' }, { status: 500 });
    }
}
