import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    // @ts-ignore
    datasourceUrl: process.env.DATABASE_URL || "postgresql://dummy:dummy@localhost:5432/dummy"
});

if (process.env.NODE_ENV !== "production" && process.env.DATABASE_URL) {
    globalForPrisma.prisma = prisma;
}
