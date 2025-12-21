import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole, requireHomeroomAccess } from '@/lib/security';

export async function GET(request: Request, { params }: { params: { studentId: string } }) {
    try {
        const studentId = params.studentId;
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { classId: true }
        });

        if (student?.classId) {
            await requireHomeroomAccess(student.classId);
        } else {
            await requireRole(['PRINCIPAL', 'SUPERADMIN']);
        }

        const remarks = await prisma.studentRemark.findMany({
            where: { studentId },
            include: {
                teacher: { select: { id: true, name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ remarks });
    } catch (e) {
        return handleApiError(e);
    }
}

export async function POST(request: Request, { params }: { params: { studentId: string } }) {
    try {
        const studentId = params.studentId;
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            select: { classId: true }
        });

        const user = student?.classId
            ? await requireHomeroomAccess(student.classId)
            : await requireRole(['PRINCIPAL', 'SUPERADMIN']);

        const { content, term } = await request.json();

        const remark = await prisma.studentRemark.create({
            data: {
                studentId,
                teacherId: user.id,
                content,
                term
            }
        });

        return NextResponse.json({ remark });
    } catch (e) {
        return handleApiError(e);
    }
}
