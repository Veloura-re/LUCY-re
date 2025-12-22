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
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

async function main() {
    try {
        const users = await prisma.user.findMany({ select: { id: true, email: true, role: true } });
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
