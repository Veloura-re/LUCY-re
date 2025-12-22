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
        console.log('--- GLOBAL SCHEMA AUDIT ---');
        const schemas = await prisma.$queryRaw`
            SELECT table_schema, table_name 
            FROM information_schema.tables 
            WHERE table_schema NOT IN ('information_schema', 'pg_catalog')
            ORDER BY table_schema, table_name;
        `;
        console.table(schemas);

        const searchPath = await prisma.$queryRaw`SHOW search_path;`;
        console.log('Search Path:', searchPath);

    } catch (e) {
        console.error('Audit Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
