// Prisma client singleton — install @prisma/client and run `prisma generate` to activate
// import { PrismaClient } from '@prisma/client'
//
// const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
// export const db = globalForPrisma.prisma ?? new PrismaClient()
// if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db

export const db = null // placeholder until Prisma is configured
