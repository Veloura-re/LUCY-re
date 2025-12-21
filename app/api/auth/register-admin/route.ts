import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
    const { userId, email, name, secretKey } = await request.json();

    // Check against ENV variable or hardcoded fallback for MVP
    const VALID_SECRET = process.env.ADMIN_SECRET_KEY || "LUCY_MASTER_KEY_2025";

    if (secretKey !== VALID_SECRET) {
        return NextResponse.json({ error: 'Invalid Administration Key.' }, { status: 403 });
    }

    try {
        const user = await prisma.user.create({
            data: {
                id: userId,
                email,
                name,
                role: 'SUPERADMIN',
                verified: true,
            }
        });
        return NextResponse.json({ user });
    } catch (e: any) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
