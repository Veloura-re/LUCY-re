const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log('No users found to test with.');
            return;
        }
        console.log('Found user:', user.email, 'ID:', user.id);

        const newId = 'test-id-' + Date.now();
        console.log('Attempting to update ID to:', newId);

        // This is likely to fail if Prisma doesn't support updating @id
        const updated = await prisma.user.update({
            where: { email: user.email },
            data: { id: newId }
        });
        console.log('Update successful! New ID:', updated.id);

    } catch (e) {
        console.error('UPDATE_ID_ERROR:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

test();
