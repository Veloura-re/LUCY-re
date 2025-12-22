const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

function getDatabaseUrl() {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        for (const line of envContent.split(/\r?\n/)) {
            const match = line.match(/^\s*DATABASE_URL\s*=\s*"?([^"\s]+)"?\s*$/);
            if (match) return match[1];
        }
    }
    return process.env.DATABASE_URL;
}

const dbUrl = getDatabaseUrl();
if (!dbUrl) {
    console.error('DATABASE_URL not found in .env or environment.');
    process.exit(1);
}

const prisma = new PrismaClient({
    datasources: {
        db: { url: dbUrl }
    }
});

async function main() {
    console.log('--- ROBUST SEED STARTING ---');
    try {
        const adminEmail = 'admin@school.edu';

        const admin = await prisma.user.upsert({
            where: { email: adminEmail },
            update: { role: 'PRINCIPAL' },
            create: {
                id: 'admin-' + Math.random().toString(36).substring(7),
                email: adminEmail,
                name: 'System Director',
                role: 'PRINCIPAL',
                verified: true
            }
        });
        console.log('Admin user ready:', admin.email);

        const school = await prisma.school.upsert({
            where: { schoolCode: 'LUCY-001' },
            update: { name: 'LUCY Academy of Excellence' },
            create: {
                name: 'LUCY Academy of Excellence',
                schoolCode: 'LUCY-001',
                status: 'ACTIVE',
            }
        });
        console.log('School Created:', school.name);

        await prisma.user.update({
            where: { id: admin.id },
            data: { schoolId: school.id }
        });

        const grade8 = await prisma.grade.upsert({
            where: { id: 'grade-8' },
            update: {},
            create: {
                id: 'grade-8',
                schoolId: school.id,
                name: 'Grade 8',
                level: 8
            }
        });

        await prisma.class.upsert({
            where: { id: 'class-8a' },
            update: {},
            create: {
                id: 'class-8a',
                gradeId: grade8.id,
                name: '8-Alpha',
                homeroomTeacherId: admin.id
            }
        });
        console.log('Grade 8 & Class 8-Alpha Created.');
        console.log('--- SEED COMPLETE ---');
    } catch (e) {
        console.error('Seeding Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
