import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { schoolId, classId, subjectId, teacherId, columns } = body;

        if (!schoolId || !classId || !subjectId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        // 1. Creation or Update of Configuration
        const config = await (prisma as any).$transaction(async (tx: any) => {
            // Find existing config
            const existing = await tx.marklistConfig.findUnique({
                where: { classId_subjectId: { classId, subjectId } },
                include: { columns: true }
            });

            if (existing) {
                // Update basic info
                await tx.marklistConfig.update({
                    where: { id: existing.id },
                    data: { teacherId, updatedAt: new Date() }
                });

                // Reconcile columns
                const existingColIds = existing.columns.map((c: any) => c.id);
                const incomingColIds = columns.filter((c: any) => c.id).map((c: any) => c.id);
                const toDelete = existingColIds.filter((id: string) => !incomingColIds.includes(id));

                if (toDelete.length > 0) {
                    await tx.marklistColumn.deleteMany({
                        where: { id: { in: toDelete } }
                    });
                }

                // Update/Create remaining
                for (const col of columns) {
                    if (col.id) {
                        await tx.marklistColumn.update({
                            where: { id: col.id },
                            data: {
                                title: col.title,
                                maxMarks: col.maxMarks,
                                order: col.order,
                                isOptional: col.isOptional
                            }
                        });
                    } else {
                        await tx.marklistColumn.create({
                            data: {
                                configId: existing.id,
                                title: col.title,
                                maxMarks: col.maxMarks,
                                order: col.order,
                                isOptional: col.isOptional
                            }
                        });
                    }
                }
                return await tx.marklistConfig.findUnique({
                    where: { id: existing.id },
                    include: { columns: true }
                });
            } else {
                // Create New
                return await tx.marklistConfig.create({
                    data: {
                        schoolId,
                        classId,
                        subjectId,
                        teacherId,
                        columns: {
                            create: columns.map((col: any) => ({
                                title: col.title,
                                maxMarks: col.maxMarks,
                                order: col.order || 0,
                                isOptional: col.isOptional || false
                            }))
                        }
                    },
                    include: { columns: true }
                });
            }
        });

        // 2. Ensure Sync with Students (Create Entry rows for all active students)
        const students = await prisma.student.findMany({
            where: {
                classId,
                enrollmentStatus: 'ACTIVE'
            },
            select: { id: true }
        });

        if (students.length > 0) {
            await Promise.all(students.map((student: { id: string }) =>
                (prisma as any).marklistEntry.upsert({
                    where: {
                        configId_studentId: { configId: config.id, studentId: student.id }
                    },
                    create: {
                        configId: config.id,
                        studentId: student.id
                    },
                    update: {}
                })
            ));
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error("Config Error:", error);
        return NextResponse.json({ error: "Failed to save configuration" }, { status: 500 });
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const classId = searchParams.get("classId");
    const subjectId = searchParams.get("subjectId");
    const id = searchParams.get("id");

    try {
        let config;

        if (id) {
            config = await (prisma as any).marklistConfig.findUnique({
                where: { id },
                include: {
                    columns: { orderBy: { order: 'asc' } },
                    class: { select: { name: true } },
                    subject: { select: { name: true } }
                }
            });
        } else if (classId && subjectId) {
            config = await (prisma as any).marklistConfig.findUnique({
                where: { classId_subjectId: { classId, subjectId } },
                include: {
                    columns: { orderBy: { order: 'asc' } as any },
                    class: { select: { name: true } },
                    subject: { select: { name: true } }
                }
            });
        } else {
            return NextResponse.json({ error: "Missing identity params" }, { status: 400 });
        }

        if (!config) {
            return NextResponse.json(null);
        }

        return NextResponse.json(config);
    } catch (error) {
        console.error("Fetch Config Error:", error);
        return NextResponse.json({ error: "Failed to fetch configuration" }, { status: 500 });
    }
}
