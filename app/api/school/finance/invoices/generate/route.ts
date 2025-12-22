import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";
import { Decimal } from "decimal.js";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { schoolId: true, role: true }
        });

        if (!dbUser?.schoolId || (dbUser.role !== 'PRINCIPAL' && dbUser.role !== 'SUPERADMIN')) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { term, dueDate } = body;

        if (!dueDate) {
            return new NextResponse("Missing due date", { status: 400 });
        }

        // 1. Fetch all students in the school
        const students = await prisma.student.findMany({
            where: { schoolId: dbUser.schoolId },
            include: { grade: true }
        });

        // 2. Fetch all active fee structures
        const universalFees = await prisma.feeStructure.findMany({
            where: {
                schoolId: dbUser.schoolId,
                gradeId: null
            }
        });

        const gradeSpecificFees = await prisma.feeStructure.findMany({
            where: {
                schoolId: dbUser.schoolId,
                gradeId: { not: null }
            }
        });

        let createdCount = 0;

        // 3. Generate Invoices
        for (const student of students) {
            const relevantGradeFees = gradeSpecificFees.filter(f => f.gradeId === student.gradeId);
            const allRelevantFees = [...universalFees, ...relevantGradeFees];

            if (allRelevantFees.length === 0) continue;

            const totalAmount = allRelevantFees.reduce((sum, fee) => sum.plus(new Decimal(fee.amount.toString())), new Decimal(0));

            // Create Invoice
            await prisma.invoice.create({
                data: {
                    studentId: student.id,
                    schoolId: dbUser.schoolId,
                    amount: totalAmount,
                    dueDate: new Date(dueDate),
                    status: 'PENDING',
                    items: {
                        create: allRelevantFees.map(fee => ({
                            name: fee.name,
                            amount: fee.amount,
                            description: `${fee.category} - ${fee.frequency}`,
                            feeStructureId: fee.id
                        }))
                    }
                }
            });
            createdCount++;
        }

        return NextResponse.json({
            success: true,
            message: `Generated ${createdCount} invoices for ${term || 'Current Cycle'}`,
            count: createdCount
        });
    } catch (error: any) {
        console.error("[INVOICES_GENERATE]", error);
        return new NextResponse(error.message || "Internal Error", { status: 500 });
    }
}
