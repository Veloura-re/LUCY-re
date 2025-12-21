import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    // Create Super Admnin
    // Note: This user must also exist in Supabase Auth with this email/password
    // The ID here should ideally match Supabase Auth ID if we are strict, 
    // or we rely on email matching logic in our app (which is risky but common for MVP seeding).
    // For now, let's just create the Prisma record.

    const superAdmin = await prisma.user.upsert({
        where: { email: 'admin@school.edu' },
        update: {},
        create: {
            email: 'admin@school.edu',
            name: 'Super Admin',
            role: 'SUPERADMIN',
            verified: true,
        },
    });

    console.log({ superAdmin })
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
