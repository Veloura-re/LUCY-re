const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const userCount = await prisma.user.count();
        console.log('Total Users in Prisma:', userCount);

        const users = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                role: true,
            },
            take: 20
        });
        console.log('User Records (First 20):', JSON.stringify(users, null, 2));

        const schools = await prisma.school.findMany({
            select: { id: true, name: true, schoolCode: true }
        });
        console.log('Schools:', JSON.stringify(schools, null, 2));

    } catch (e) {
        console.error('Error querying database:', e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
