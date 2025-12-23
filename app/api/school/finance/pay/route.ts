import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { invoiceId, method = "CARD" } = body;

        if (!invoiceId) return new NextResponse("Missing Invoice ID", { status: 400 });

        // Verify User owns the invoice (via Student Link)
        // OR is Admin
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { parentLinks: true }
        });

        if (!dbUser) return new NextResponse("User not found", { status: 404 });

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { student: true }
        });

        if (!invoice) return new NextResponse("Invoice not found", { status: 404 });

        let isAuthorized = false;
        if (dbUser.role === 'PRINCIPAL' || dbUser.role === 'SUPERADMIN' || dbUser.role === 'TEACHER') {
            // Admin can settle payments manually? 
            // Let's assume yes for now, if they are in the same school.
            // But primarily this is for PARENTS.
            if (dbUser.schoolId === invoice.schoolId) isAuthorized = true;
        } else if (dbUser.role === 'PARENT') {
            // Check if parent is linked to student
            const linked = dbUser.parentLinks.some(link => link.studentId === invoice.studentId);
            if (linked) isAuthorized = true;
        }

        if (!isAuthorized) return new NextResponse("Forbidden", { status: 403 });

        if (invoice.status === 'PAID') {
            return NextResponse.json({ message: "Already Paid" });
        }

        // Transaction
        const result = await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.create({
                data: {
                    invoiceId: invoice.id,
                    amount: invoice.amount,
                    method: method,
                    status: 'SUCCESS'
                }
            });

            await tx.invoice.update({
                where: { id: invoice.id },
                data: { status: 'PAID' }
            });

            return payment;
        });

        return NextResponse.json({ success: true, payment: result });

    } catch (error: any) {
        console.error("[PAYMENT_POST]", error);
        return new NextResponse("Internal Error", { status: 500 });
    }
}
