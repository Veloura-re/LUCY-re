import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { handleApiError, requireRole } from '@/lib/security';

export async function GET(request: Request) {
    try {
        const user = await requireRole(['HOMEROOM', 'PRINCIPAL', 'SUPERADMIN']);

        // Find the class where this user is the homeroom teacher
        const classRecord = await prisma.class.findFirst({
            where: { homeroomTeacherId: user.id },
            include: {
                grade: true,
                students: {
                    include: {
                        user: true,
                        parentLinks: {
                            include: {
                                parent: true
                            }
                        },
                        gradeRecords: {
                            include: {
                                subject: true
                            }
                        },
                        attendanceRecords: {
                            take: 5,
                            orderBy: { date: 'desc' }
                        }
                    }
                }
            }
        });

        if (!classRecord) {
            return NextResponse.json({ error: "No assigned homeroom class found" }, { status: 404 });
        }

        return NextResponse.json({ homeroom: classRecord });
    } catch (e) {
        return handleApiError(e);
    }
}
