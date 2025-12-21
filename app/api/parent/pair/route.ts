import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { studentCode } = await request.json();

        if (!studentCode) {
            return NextResponse.json({ error: 'Student code is required' }, { status: 400 });
        }

        // 1. Find the student by code
        const student = await prisma.student.findUnique({
            where: { studentCode: studentCode.toUpperCase() },
            include: { school: true }
        });

        if (!student) {
            return NextResponse.json({ error: 'Invalid student code' }, { status: 404 });
        }

        // 2. Get current parent user
        const dbParent = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!dbParent || dbParent.role !== 'PARENT') {
            return NextResponse.json({ error: 'Only parent accounts can link to students' }, { status: 403 });
        }

        // 3. Check if link already exists
        const existingLink = await prisma.parentStudentLink.findFirst({
            where: {
                parentId: dbParent.id,
                studentId: student.id
            }
        });

        if (existingLink) {
            return NextResponse.json({ error: 'Student already linked to this account' }, { status: 400 });
        }

        // 4. Create the link
        await prisma.parentStudentLink.create({
            data: {
                parentId: dbParent.id,
                studentId: student.id,
                pairingMethod: 'CODE',
                verifiedAt: new Date()
            }
        });

        // 5. Ensure parent is linked to the school if not already
        if (!dbParent.schoolId) {
            await prisma.user.update({
                where: { id: dbParent.id },
                data: { schoolId: student.schoolId }
            });
        }

        return NextResponse.json({ success: true, studentName: `${student.firstName} ${student.lastName}` });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Pairing failed' }, { status: 500 });
    }
}
