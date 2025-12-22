const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const schools = await prisma.school.count();
        const users = await prisma.user.count();
        const students = await prisma.student.count();
        const grades = await prisma.grade.count();
        const auditLogs = await prisma.auditLog.count();

        console.log('Database Status:');
        console.log(`Schools: ${schools}`);
        console.log(`Users: ${users}`);
        console.log(`Students: ${students}`);
        console.log(`Grades: ${grades}`);
        console.log(`AuditLogs: ${auditLogs}`);

        const lastUser = await prisma.user.findFirst({ orderBy: { createdAt: 'desc' } });
        console.log('Last User:', lastUser?.email || 'None');

    } catch (e) {
        console.error('Diagnostic error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
