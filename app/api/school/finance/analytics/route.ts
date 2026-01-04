import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const dbUser = await prisma.user.findUnique({
            where: { id: user.id }
        });

        if (!dbUser || !dbUser.schoolId) return new NextResponse("Institutional context missing", { status: 404 });

        // 1. Get Monthly Revenue (Last 12 Months)
        const labels: string[] = [];
        const datasets: { label: string, data: number[] }[] = [
            { label: "Successful Revenue", data: [] },
            { label: "Pending Invoices", data: [] }
        ];

        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = d.toLocaleString('default', { month: 'short', year: '2-digit' });
            labels.push(monthLabel);

            const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);

            // Fetch successful payments in this month
            const successfulPayments = await prisma.payment.aggregate({
                where: {
                    status: 'SUCCESS',
                    createdAt: { gte: d, lt: nextMonth },
                    invoice: { schoolId: dbUser.schoolId }
                },
                _sum: { amount: true }
            });

            // Fetch pending/overdue invoices created in this month
            const pendingInvoices = await prisma.invoice.aggregate({
                where: {
                    status: { in: ['PENDING', 'OVERDUE'] },
                    createdAt: { gte: d, lt: nextMonth },
                    schoolId: dbUser.schoolId
                },
                _sum: { amount: true }
            });

            datasets[0].data.push(Number(successfulPayments._sum.amount || 0));
            datasets[1].data.push(Number(pendingInvoices._sum.amount || 0));
        }

        // 2. Overview Metrics
        const totalRevenue = await prisma.payment.aggregate({
            where: { status: 'SUCCESS', invoice: { schoolId: dbUser.schoolId } },
            _sum: { amount: true }
        });

        const totalPending = await prisma.invoice.aggregate({
            where: { status: { in: ['PENDING', 'OVERDUE'] }, schoolId: dbUser.schoolId },
            _sum: { amount: true }
        });

        const categorySummary = await prisma.feeStructure.findMany({
            where: { schoolId: dbUser.schoolId },
            select: { category: true, amount: true }
        });

        const efficiency = totalRevenue._sum.amount
            ? (Number(totalRevenue._sum.amount) / (Number(totalRevenue._sum.amount) + Number(totalPending._sum.amount || 0))) * 100
            : 0;

        return NextResponse.json({
            trends: { labels, datasets },
            summary: {
                totalLiquidity: Number(totalRevenue._sum.amount || 0),
                totalPending: Number(totalPending._sum.amount || 0),
                efficiency: efficiency.toFixed(1)
            }
        });

    } catch (error: any) {
        console.error("[FINANCE_ANALYTICS]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
