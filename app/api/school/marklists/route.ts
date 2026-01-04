import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireRole, requireSchoolLinked } from '@/lib/security';

// GET: List Marklists (Exams)
export async function GET(request: Request) {
    try {
        const user = await requireSchoolLinked();
        const { searchParams } = new URL(request.url);
        const classId = searchParams.get('classId');
        const subjectId = searchParams.get('subjectId');

        const where: any = {
            class: { grade: { schoolId: user.schoolId } } // Ensure school scope via Class->Grade->School or directly checks?
            // Exam doesn't have schoolId directly, it links to Class. Class links to Grade links to School.
            // Better to filter by classId provided or all classes in school.
        };

        if (classId) where.classId = classId;
        if (subjectId) where.subjectId = subjectId;

        // If Teacher, strictly filter to their assignments?
        // User requirements say "Teacher View ONLY assigned classes".
        if (user.role === 'TEACHER') {
            // Find assignments
            const assignments = await prisma.teacherAssignment.findMany({
                where: { teacherId: user.id },
                select: { classId: true, subjectId: true }
            });
            const classIds = assignments.map(a => a.classId);
            const subjectIds = assignments.map(a => a.subjectId);

            // Filter exams where classId IS in assignments AND subjectId IS in assignments
            // OR logic: Teacher teaches Class A Subject Math. Should see Exams for Class A Subject Math.
            // Simplified: where classId IN classIds.
            if (classIds.length > 0) {
                where.classId = { in: classIds };
                // And subjectId? If I teach Math I shouldn't see English exams even if in same class.
                where.subjectId = { in: subjectIds };
            } else {
                return NextResponse.json({ exams: [] }); // No assignments
            }
        }

        const exams = await prisma.exam.findMany({
            where,
            include: {
                class: { select: { name: true, grade: { select: { name: true, level: true } } } },
                subject: { select: { name: true } },
                _count: { select: { gradeRecords: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ exams });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to fetch marklists" }, { status: 500 });
    }
}

// POST: Create a new Marklist
export async function POST(request: Request) {
    try {
        const user = await requireRole(['PRINCIPAL', 'SUPERADMIN', 'TEACHER']);
        // Teachers can create marklists for their subjects? Yes.

        const { title, classId, subjectId, totalMarks, category, description, date } = await request.json();

        // Validate assignment if Teacher
        if (user.role === 'TEACHER') {
            const assignment = await prisma.teacherAssignment.findFirst({
                where: {
                    teacherId: user.id,
                    classId,
                    subjectId
                }
            });
            if (!assignment) {
                return NextResponse.json({ error: "You are not assigned to this Class and Subject" }, { status: 403 });
            }
        }

        const marklist = await prisma.exam.create({
            data: {
                title,
                classId,
                subjectId,
                totalMarks: parseFloat(totalMarks),
                category,
                description,
                createdById: user.id,
                availableFrom: date ? new Date(date) : new Date(),
            }
        });

        // Optional: Pre-fill GradeRecords with 0 or null for all students in class?
        // Not necessary, UI can handle "missing" grades.

        return NextResponse.json({ marklist });

    } catch (e: any) {
        return NextResponse.json({ error: e.message || "Failed to create marklist" }, { status: 500 });
    }
}
