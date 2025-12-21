import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined
}

// Fix for "prepared statement already exists" with Supabase Transaction Mode
const rawConnectionString = process.env.DATABASE_URL;

// Resilient connection string handling (trim whitespace and stray quotes)
const connectionString = rawConnectionString?.trim().replace(/^["']|["']$/g, '');

// Append pgbouncer=true if not present to force simple query mode for Supabase Transaction mode
const pgbouncerAdded = connectionString && !connectionString.includes('pgbouncer=true')
    ? `${connectionString}${connectionString.includes('?') ? '&' : '?'}pgbouncer=true`
    : connectionString;

// Ensure sslmode=require for Supabase poolers (port 6543 / pooler.supabase.com)
const url = pgbouncerAdded && pgbouncerAdded.includes('pooler.supabase.com') && !pgbouncerAdded.includes('sslmode=')
    ? `${pgbouncerAdded}${pgbouncerAdded.includes('?') ? '&' : '?'}sslmode=require`
    : pgbouncerAdded;

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    datasources: {
        db: {
            url: url,
        },
    },
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
