import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST,
    },
  },
})

export async function setupTestDatabase() {
  // Run migrations
  execSync('bunx prisma migrate deploy', {
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL_TEST,
    },
  })

  // Clear database
  await prisma.file.deleteMany()
  await prisma.folder.deleteMany()
}

export async function teardownTestDatabase() {
  await prisma.$disconnect()
}

export { prisma }