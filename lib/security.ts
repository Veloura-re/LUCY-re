import { createClient } from '@/utils/supabase/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@prisma/client';
import { NextResponse } from 'next/server';

/**
 * Ensures a user is authenticated.
 * Returns the Supabase User object or throws an error.
 */
export async function requireAuth() {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        throw new Error("Unauthorized: Login required");
    }

    return user;
}

/**
 * Ensures the Current User has one of the allowed roles.
 * Returns the DB User object (with Role and SchoolId) or throws.
 */
export async function requireRole(allowedRoles: Role[]) {
    const user = await requireAuth();

    // We need the DB user to check the role, as metadata might be stale
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, schoolId: true, name: true }
    });

    if (!dbUser) {
        throw new Error("Unauthorized: User record not found");
    }

    if (!allowedRoles.includes(dbUser.role)) {
        throw new Error(`Forbidden: Access denied for role ${dbUser.role}`);
    }

    return dbUser;
}

/**
 * Ensures the Current User is linked to a school.
 * Returns the DB User object with guaranteed schoolId.
 */
export async function requireSchoolLinked() {
    const user = await requireAuth();

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { id: true, role: true, schoolId: true }
    });

    if (!dbUser?.schoolId) {
        throw new Error("Forbidden: No school linked to this account");
    }

    return { ...dbUser, schoolId: dbUser.schoolId }; // Type narrowing
}

/**
 * Ensures the user is the assigned Homeroom Teacher for a class.
 */
export async function requireHomeroomAccess(classId: string) {
    const user = await requireRole(['TEACHER', 'HOMEROOM', 'PRINCIPAL', 'SUPERADMIN']);

    // Principals and Superadmins have bypass access
    if (user.role === 'PRINCIPAL' || user.role === 'SUPERADMIN') return user;

    const classRecord = await prisma.class.findUnique({
        where: { id: classId },
        select: { homeroomTeacherId: true }
    });

    if (classRecord?.homeroomTeacherId !== user.id) {
        throw new Error("Forbidden: You are not the homeroom teacher for this class");
    }

    return user;
}

/**
 * Check if a user is the homeroom teacher for a specific class.
 */
export async function isHomeroomTeacher(userId: string, classId: string) {
    const classRecord = await prisma.class.findUnique({
        where: { id: classId },
        select: { homeroomTeacherId: true }
    });
    return classRecord?.homeroomTeacherId === userId;
}

/**
 * Standard API Error Response Wrapper
 */
export function handleApiError(error: unknown) {
    console.error("API Security Error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";

    if (message.startsWith("Unauthorized")) return NextResponse.json({ error: message }, { status: 401 });
    if (message.startsWith("Forbidden")) return NextResponse.json({ error: message }, { status: 403 });

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
}
