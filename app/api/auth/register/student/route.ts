import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/utils/supabase/server';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { studentCode, email, password } = await req.json();

        if (!studentCode || !password) {
            return NextResponse.json({ error: "Student Token and Secure Keyphrase required" }, { status: 400 });
        }

        // 1. Verify Student Code exists and is unused
        const student = await prisma.student.findUnique({
            where: { studentCode }
        });

        if (!student) {
            return NextResponse.json({ error: "Invalid Authorization Token" }, { status: 404 });
        }

        if (student.userId) {
            return NextResponse.json({ error: "Token already claimed" }, { status: 409 });
        }

        const finalEmail = email || `${studentCode.toLowerCase()}@lucy.local`; // Use .local to avoid real emails if none provided

        // 2. Register in Supabase Auth
        const supabase = await createClient();
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: finalEmail,
            password: password,
            options: {
                data: {
                    role: 'STUDENT',
                    full_name: `${student.firstName} ${student.lastName}`
                }
            }
        });

        if (authError) {
            console.error("Supabase Auth Error:", authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        if (!authData.user) {
            return NextResponse.json({ error: "Authentication Provider Failed" }, { status: 500 });
        }

        // 3. Create User Account in Prisma (Synced with Supabase ID)
        // Note: Password hash is optional here if using Supabase, but keeping for consistency if needed.
        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    id: authData.user!.id, // CRITICAL: SYNC ID
                    email: finalEmail,
                    passwordHash: hashedPassword,
                    name: `${student.firstName} ${student.lastName}`,
                    role: "STUDENT",
                    schoolId: student.schoolId,
                    verified: true
                }
            });

            // 4. Link Student to User
            await tx.student.update({
                where: { id: student.id },
                data: { userId: user.id }
            });

            return user;
        });

        return NextResponse.json({
            success: true,
            message: "Identity Verification Complete. Access Granted.",
            user: { id: result.id, name: result.name, email: result.email }
        });

    } catch (e: any) {
        console.error("Student Registration Error:", e);
        // Clean up Supabase user if Prisma fails? 
        // Ideally yes, but complex w/o admin client. 
        // For now, let it fail.
        return NextResponse.json({ error: e.message || "Registration Protocol Failed" }, { status: 500 });
    }
}
