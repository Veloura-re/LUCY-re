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
        // We must delete entities in order to satisfy foreign key constraints
        // since we cannot rely on DB cascades in this environment.
        await prisma.$transaction(async (tx) => {
            // 1. Delete Student-related dependents
            await tx.parentStudentLink.deleteMany({ where: { student: { schoolId: id } } });
            await tx.attendanceRecord.deleteMany({ where: { student: { schoolId: id } } });
            await tx.gradeRecord.deleteMany({ where: { student: { schoolId: id } } });
            await tx.examAttempt.deleteMany({ where: { student: { schoolId: id } } });
            await tx.certificate.deleteMany({ where: { student: { schoolId: id } } });
            await tx.studentRemark.deleteMany({ where: { student: { schoolId: id } } });
            await tx.internalNote.deleteMany({ where: { student: { schoolId: id } } });

            // 2. Delete School Business dependents
            await tx.payment.deleteMany({ where: { invoice: { schoolId: id } } });
            await tx.invoiceItem.deleteMany({ where: { invoice: { schoolId: id } } });
            await tx.invoice.deleteMany({ where: { schoolId: id } });
            await tx.feeStructure.deleteMany({ where: { schoolId: id } });

            // 3. Delete Academic Structure
            await tx.exam.deleteMany({ where: { class: { grade: { schoolId: id } } } });
            await tx.timetable.deleteMany({ where: { class: { grade: { schoolId: id } } } });
            await tx.teacherAssignment.deleteMany({ where: { class: { grade: { schoolId: id } } } });
            await tx.period.deleteMany({ where: { schoolId: id } });
            await tx.class.deleteMany({ where: { grade: { schoolId: id } } });
            await tx.grade.deleteMany({ where: { schoolId: id } });
            await tx.subject.deleteMany({ where: { schoolId: id } });

            // 4. Delete Communication & Interaction
            await tx.message.deleteMany({ where: { schoolId: id } });
            await tx.chatRoomMember.deleteMany({ where: { chatRoom: { schoolId: id } } });
            await tx.chatRoom.deleteMany({ where: { schoolId: id } });
            await tx.event.deleteMany({ where: { schoolId: id } });
            await tx.auditLog.deleteMany({ where: { user: { schoolId: id } } });
            await tx.inviteToken.deleteMany({ where: { schoolId: id } });

            // 5. Delete Base Entities
            await tx.student.deleteMany({ where: { schoolId: id } });
            await tx.user.deleteMany({ where: { schoolId: id } });

            // 6. Finally delete the school
            await tx.school.delete({
                where: { id }
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting school:", error);
        return NextResponse.json({
            error: 'Failed to delete school',
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
