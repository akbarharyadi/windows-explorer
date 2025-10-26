import { PrismaClient } from '@prisma/client'
import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables from root .env (5 levels up from src/infrastructure/database/)
config({ path: join(__dirname, '../../../../../.env') })

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Clear existing data
  await prisma.file.deleteMany()
  await prisma.folder.deleteMany()

  // Create root folders
  const root1 = await prisma.folder.create({
    data: {
      name: 'Documents',
      parentId: null,
    },
  })

  const root2 = await prisma.folder.create({
    data: {
      name: 'Pictures',
      parentId: null,
    },
  })

  const root3 = await prisma.folder.create({
    data: {
      name: 'Projects',
      parentId: null,
    },
  })

  // Create sub-folders for Documents
  const work = await prisma.folder.create({
    data: {
      name: 'Work',
      parentId: root1.id,
    },
  })

  const personal = await prisma.folder.create({
    data: {
      name: 'Personal',
      parentId: root1.id,
    },
  })

  // Create deeper nesting
  const reports = await prisma.folder.create({
    data: {
      name: 'Reports',
      parentId: work.id,
    },
  })

  const contracts = await prisma.folder.create({
    data: {
      name: 'Contracts',
      parentId: work.id,
    },
  })

  const taxes = await prisma.folder.create({
    data: {
      name: 'Taxes',
      parentId: personal.id,
    },
  })

  // Create sub-folders for Pictures
  const vacation = await prisma.folder.create({
    data: {
      name: 'Vacation 2024',
      parentId: root2.id,
    },
  })

  await prisma.folder.create({
    data: {
      name: 'Family',
      parentId: root2.id,
    },
  })

  // Create sub-folders for Projects
  const webDev = await prisma.folder.create({
    data: {
      name: 'Web Development',
      parentId: root3.id,
    },
  })

  const frontend = await prisma.folder.create({
    data: {
      name: 'Frontend',
      parentId: webDev.id,
    },
  })

  const backend = await prisma.folder.create({
    data: {
      name: 'Backend',
      parentId: webDev.id,
    },
  })

  // Create files
  await prisma.file.createMany({
    data: [
      // Files in Reports
      { name: 'Q1-Report.pdf', folderId: reports.id, size: 524288, mimeType: 'application/pdf' },
      { name: 'Q2-Report.pdf', folderId: reports.id, size: 612352, mimeType: 'application/pdf' },

      // Files in Contracts
      {
        name: 'NDA.docx',
        folderId: contracts.id,
        size: 45056,
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      },
      {
        name: 'Employment-Contract.pdf',
        folderId: contracts.id,
        size: 256000,
        mimeType: 'application/pdf',
      },

      // Files in Taxes
      {
        name: '2023-Tax-Return.xlsx',
        folderId: taxes.id,
        size: 98304,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },

      // Files in Vacation
      { name: 'beach.jpg', folderId: vacation.id, size: 2048576, mimeType: 'image/jpeg' },
      { name: 'sunset.jpg', folderId: vacation.id, size: 1835008, mimeType: 'image/jpeg' },

      // Files in Frontend
      { name: 'App.vue', folderId: frontend.id, size: 4096, mimeType: 'text/plain' },
      { name: 'main.ts', folderId: frontend.id, size: 2048, mimeType: 'text/plain' },

      // Files in Backend
      { name: 'server.ts', folderId: backend.id, size: 8192, mimeType: 'text/plain' },
      { name: 'routes.ts', folderId: backend.id, size: 6144, mimeType: 'text/plain' },
    ],
  })

  console.log('✅ Database seeded successfully!')

  // Print statistics
  const folderCount = await prisma.folder.count()
  const fileCount = await prisma.file.count()

  console.log(`📁 Created ${folderCount} folders`)
  console.log(`📄 Created ${fileCount} files`)
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
