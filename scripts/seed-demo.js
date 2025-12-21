const { PrismaClient } = require('@prisma/client');
require('dotenv').config();
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding demo data...');

    // 1. Create a School
    const school = await prisma.school.create({
        data: {
            name: 'LUCY Academy',
            schoolCode: 'LUCY-ACADEMY',
            status: 'ACTIVE',
        },
    });
    console.log(`Created School: ${school.name}`);

    // 2. Create a Grade
    const grade = await prisma.grade.create({
        data: {
            name: 'Grade 10',
            level: 10,
            schoolId: school.id,
        },
    });
    console.log(`Created Grade: ${grade.name}`);

    // 3. Create a Demo Student
    const student = await prisma.student.create({
        data: {
            firstName: 'Lucas',
            lastName: 'Skywalker',
            studentCode: 'LUCY-STU-001',
            schoolId: school.id,
            gradeId: grade.id,
            enrollmentStatus: 'ACTIVE',
        }
    });
    console.log(`Created Student: ${student.firstName} ${student.lastName} (Code: ${student.studentCode})`);

    console.log('✅ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
