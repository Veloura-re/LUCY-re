import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const studentCode = searchParams.get('studentCode');

    if (!studentCode) {
        return NextResponse.json({ error: 'Student code is required' }, { status: 400 });
    }

    try {
        // Find the staff user to get their schoolId
        const staffUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { role: true, schoolId: true }
        });

        if (!staffUser || !['SUPERADMIN', 'PRINCIPAL', 'TEACHER', 'HOMEROOM'].includes(staffUser.role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Find the student and their linked parents
        const student = await prisma.student.findUnique({
            where: {
                studentCode: studentCode.toUpperCase(),
                // If not SUPERADMIN, restrict to the same school
                ...(staffUser.role !== 'SUPERADMIN' ? { schoolId: staffUser.schoolId! } : {})
            },
            include: {
                parentLinks: {
                    include: {
                        parent: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                role: true,
                                createdAt: true
                            }
                        }
                    }
                },
                class: true,
                grade: true
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Student not found or access denied' }, { status: 404 });
        }

        return NextResponse.json({
            student: {
                name: `${student.firstName} ${student.lastName}`,
                code: student.studentCode,
                className: (student as any).class?.name,
                gradeName: (student as any).grade?.name
            },
            parents: (student as any).parentLinks.map((link: any) => link.parent)
        });

    } catch (error) {
        console.error("Error searching for parents:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
