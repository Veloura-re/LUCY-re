import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch Grid Data (Entries + Marks)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const configId = searchParams.get("configId");

    if (!configId) {
        return NextResponse.json({ error: "Missing configId" }, { status: 400 });
    }

    try {
        // Return all entries with their marks for this config
        const entries = await (prisma as any).marklistEntry.findMany({
            where: { configId },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        studentCode: true
                    }
                },
                marks: true
            },
            orderBy: {
                student: { firstName: 'asc' }
            }
        });

        return NextResponse.json(entries);
    } catch (error) {
        console.error("Fetch Entries Error:", error);
        return NextResponse.json({ error: "Failed to fetch entries" }, { status: 500 });
    }
}

// POST: Save Marks (Bulk Update)
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { configId, updates } = body;

        if (!configId) {
            return NextResponse.json({ error: "Configuration ID Missing" }, { status: 400 });
        }

        if (!updates || !Array.isArray(updates) || updates.length === 0) {
            return NextResponse.json({ error: "No changes detected to commit" }, { status: 400 });
        }

        await (prisma as any).$transaction(async (tx: any) => {
            const config = await tx.marklistConfig.findUnique({
                where: { id: configId },
                include: { columns: true }
            });

            if (!config) throw new Error("Config not found");
            const colMap = new Map(config.columns.map((c: any) => [c.id, c]));

            for (const update of updates) {
                const { studentId, marks, remarks } = update;

                const entry = await tx.marklistEntry.upsert({
                    where: { configId_studentId: { configId, studentId } },
                    create: { configId, studentId, remarks },
                    update: { remarks }
                });

                // Upsert individual marks if provided
                if (marks && Array.isArray(marks)) {
                    for (const m of marks) {
                        await tx.marklistMark.upsert({
                            where: { entryId_columnId: { entryId: entry.id, columnId: m.columnId } },
                            update: { score: m.score },
                            create: { entryId: entry.id, columnId: m.columnId, score: m.score }
                        });
                    }
                }

                // Recalculate Totals for this entry
                const currentEntry = await tx.marklistEntry.findUnique({
                    where: { id: entry.id },
                    include: { marks: true }
                });

                if (currentEntry) {
                    let total = 0;
                    let totalMaxMarks = 0;

                    config.columns.forEach((col: any) => {
                        const mark = currentEntry.marks.find((m: any) => m.columnId === col.id);
                        const score = mark ? mark.score : 0;

                        if (col.isOptional) {
                            if (mark) {
                                total += score;
                                totalMaxMarks += col.maxMarks;
                            }
                        } else {
                            total += score;
                            totalMaxMarks += col.maxMarks;
                        }
                    });

                    const percentage = totalMaxMarks > 0 ? (total / totalMaxMarks) * 100 : 0;

                    // Manual Grade Rules (Placeholder logic, can be customized)
                    let grade = "F";
                    if (percentage >= 90) grade = "A+";
                    else if (percentage >= 80) grade = "A";
                    else if (percentage >= 70) grade = "B";
                    else if (percentage >= 60) grade = "C";
                    else if (percentage >= 50) grade = "D";
                    else if (percentage >= 40) grade = "E";

                    await tx.marklistEntry.update({
                        where: { id: currentEntry.id },
                        data: { total, percentage, grade }
                    });
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Save Marks Error:", error);
        return NextResponse.json({ error: "Failed to save marks" }, { status: 500 });
    }
}
