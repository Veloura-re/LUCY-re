const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const counts = {
            users: await prisma.user.count(),
            schools: await prisma.school.count(),
            students: await prisma.student.count(),
        };
        console.log('--- COUNTS ---');
        console.log(JSON.stringify(counts, null, 2));

        const users = await prisma.user.findMany({
            select: { id: true, email: true, role: true, schoolId: true },
            take: 10
        });
        console.log('--- USERS ---');
        console.log(JSON.stringify(users, null, 2));

        const students = await prisma.student.findMany({
            select: { id: true, firstName: true, lastName: true, studentCode: true, userId: true },
            take: 10
        });
        console.log('--- STUDENTS ---');
        console.log(JSON.stringify(students, null, 2));

    } catch (e) {
        console.error('DATABASE_ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

check();
