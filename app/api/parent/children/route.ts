import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const links = await prisma.parentStudentLink.findMany({
            where: { parentId: user.id },
            include: {
                student: {
                    include: {
                        grade: true,
                        school: true,
                        class: true
                    }
                }
            }
        });

        const students = await Promise.all(links.map(async (link) => {
            const principal = await prisma.user.findFirst({
                where: { schoolId: link.student.schoolId, role: 'PRINCIPAL' },
                select: { id: true, name: true }
            });
            return {
                ...link.student,
                principal
            };
        }));

        return NextResponse.json({ students });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }
}
