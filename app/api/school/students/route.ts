import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole, requireSchoolLinked } from '@/lib/security';

// GET: List all students in the school
export async function GET(request: Request) {
    try {
        // [SECURITY] Any staff can view list? Or just teachers/admins?
        // Allowing all staff for now to enable directory features, but strictly linked to their school.
        const user = await requireSchoolLinked();

        const students = await prisma.student.findMany({
            where: { schoolId: user.schoolId },
            include: {
                grade: true,
                class: true,
                parentLinks: {
                    include: {
                        parent: {
                            select: { id: true, name: true, role: true }
                        }
                    }
                }
            },
            orderBy: { lastName: 'asc' }
        });
        return NextResponse.json({ students });

    } catch (e) {
        return handleApiError(e);
    }
}

// POST: Add a new student
export async function POST(request: Request) {
    try {
        // [SECURITY] STRICTLY Principals/Admins only. Teachers cannot add students.
        const user = await requireRole(['PRINCIPAL', 'SUPERADMIN']);

        // Ensure Principal is linked to a school (Superadmin might need payload override, handling Principal case first)
        if (!user.schoolId && user.role !== 'SUPERADMIN') {
            return NextResponse.json({ error: "Configuration Error: User not linked to school" }, { status: 403 });
        }

        const targetSchoolId = user.schoolId; // For SuperAdmin we'd need to parse from body, ignoring for now as directed

        const { firstName, lastName, grade, classId, email } = await request.json();

        // Find Grade or FAIL if strict, but adhering to prev logic:
        let gradeRecord: any;

        if (grade) {
            gradeRecord = await prisma.grade.findFirst({
                where: { schoolId: targetSchoolId!, level: parseInt(grade) || 0 }
            });

            if (!gradeRecord) {
                gradeRecord = await prisma.grade.create({
                    data: {
                        schoolId: targetSchoolId!,
                        level: parseInt(grade) || 0,
                        name: `Grade ${grade}`
                    }
                });
            }
        }

        const student = await prisma.student.create({
            data: {
                firstName,
                lastName,
                schoolId: targetSchoolId!,
                gradeId: gradeRecord?.id, // Should validate
                classId: classId || null,
                email: email || null,
                dob: new Date(),
                studentCode: `ST-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
            }
        });

        return NextResponse.json({ student });

    } catch (e: any) {
        return handleApiError(e);
    }
}
