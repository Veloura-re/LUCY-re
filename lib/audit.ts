import { prisma } from './prisma';

export async function logActivity({
    userId,
    action,
    resourceType,
    resourceId,
    before,
    after,
    ip
}: {
    userId: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    before?: any;
    after?: any;
    ip?: string;
}) {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resourceType,
                resourceId,
                before: before ? JSON.parse(JSON.stringify(before)) : undefined,
                after: after ? JSON.parse(JSON.stringify(after)) : undefined,
                ip
            }
        });
    } catch (e) {
        console.error("Failed to log activity:", e);
    }
}
