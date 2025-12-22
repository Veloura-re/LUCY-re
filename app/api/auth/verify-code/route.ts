import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { code } = body;

        if (!code) {
            return NextResponse.json({ error: "Code is required" }, { status: 400 });
        }

        const student = await prisma.student.findUnique({
            where: { studentCode: code },
            include: {
                school: true,
                grade: true
            }
        });

        if (!student) {
            return NextResponse.json({ error: "Invalid Access Code" }, { status: 404 });
        }

        return NextResponse.json({
            student: {
                firstName: student.firstName,
                lastName: student.lastName,
                schoolName: student.school.name,
                gradeLevel: student.grade?.level || 0,
                id: student.id
            }
        });

    } catch (e: any) {
        console.error("Verification Error:", e);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
