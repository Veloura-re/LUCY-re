const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.student.findMany({
        include: { user: true }
    });

    console.log("--- STUDENT CODES ---");
    students.forEach(s => {
        const status = s.user ? `Registered as ${s.user.email}` : "UNREGISTERED (Ready to use)";
        console.log(`Name: ${s.firstName} ${s.lastName} | Code: ${s.studentCode} | Status: ${status}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
