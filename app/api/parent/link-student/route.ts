import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { studentCode, confirm } = await request.json();

    try {
        const student = await prisma.student.findUnique({
            where: { studentCode: studentCode.toUpperCase() },
            include: {
                grade: true,
                school: true
            }
        });

        if (!student) {
            return NextResponse.json({ error: 'Invalid Student Code' }, { status: 404 });
        }

        // 1. Verification Mode: Just return student details (masked if needed)
        if (!confirm) {
            return NextResponse.json({
                success: true,
                student: {
                    id: student.id,
                    firstName: student.firstName,
                    lastName: student.lastName,
                    schoolName: student.school.name, // Show school name for trust
                    gradeLevel: student.grade?.level     // Show grade for confirmation
                }
            });
        }

        // 2. Linking Mode: Create the relationship
        const link = await prisma.parentStudentLink.create({
            data: {
                parentId: user.id,
                studentId: student.id,
                pairingMethod: 'CODE',
                verifiedAt: new Date()
            }
        });

        // 3. Ensure parent is linked to the school if not already
        const dbParent = await prisma.user.findUnique({ where: { id: user.id } });
        if (dbParent && !dbParent.schoolId) {
            await prisma.user.update({
                where: { id: user.id },
                data: { schoolId: student.schoolId }
            });
        }

        return NextResponse.json({ success: true, link });

    } catch (e: any) {
        if (e.code === 'P2002') {
            return NextResponse.json({ error: 'You are already linked to this student.' }, { status: 400 });
        }
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
