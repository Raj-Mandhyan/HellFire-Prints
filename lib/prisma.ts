import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from 'pg';

// Prevent multiple instances of Prisma Client in development due to hot reloading
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is missing.');
}

// Explicitly use sslmode=verify-full to enforce full certificate verification and prevent pg-connection-string deprecation warnings
const connectionString = databaseUrl.replace(
  /([?&]sslmode=)(?:require|prefer|verify-ca)(?=&|$)/g,
  '$1verify-full'
);

const isNeon = connectionString.includes('neon.tech');
const adapter = isNeon ? new PrismaNeon({ connectionString }) : new PrismaPg(new Pool({ connectionString }));

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
