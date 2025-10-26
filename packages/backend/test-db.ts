import { prisma } from './src/infrastructure/database/prisma'

async function test() {
  console.log('🔍 Testing database connection and queries...\n')

  // Test 1: Count folders and files
  const folderCount = await prisma.folder.count()
  const fileCount = await prisma.file.count()

  console.log(`✅ Test 1: Database has ${folderCount} folders and ${fileCount} files`)

  // Test 2: Get root folders
  const rootFolders = await prisma.folder.findMany({
    where: { parentId: null },
    orderBy: { name: 'asc' },
  })

  console.log(`✅ Test 2: Found ${rootFolders.length} root folders:`)
  rootFolders.forEach((folder) => console.log(`   - ${folder.name}`))

  // Test 3: Get folder tree with nested children
  const folders = await prisma.folder.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          children: {
            include: {
              files: true,
            },
          },
          files: true,
        },
      },
      files: true,
    },
  })

  console.log('\n✅ Test 3: Folder hierarchy:')
  folders.forEach((root) => {
    console.log(`\n📁 ${root.name}`)
    root.children.forEach((child) => {
      console.log(`  📁 ${child.name}`)
      child.children.forEach((grandchild) => {
        console.log(`    📁 ${grandchild.name} (${grandchild.files.length} files)`)
      })
      if (child.files.length > 0) {
        console.log(`    ${child.files.length} files`)
      }
    })
    if (root.files.length > 0) {
      console.log(`  ${root.files.length} files`)
    }
  })

  // Test 4: Search folders
  const searchResults = await prisma.folder.findMany({
    where: {
      name: {
        contains: 'work',
        mode: 'insensitive',
      },
    },
  })

  console.log(`\n✅ Test 4: Search for 'work' found ${searchResults.length} folders:`)
  searchResults.forEach((folder) => console.log(`   - ${folder.name}`))

  // Test 5: Get files with folder info
  const files = await prisma.file.findMany({
    take: 5,
    include: {
      folder: true,
    },
    orderBy: { name: 'asc' },
  })

  console.log(`\n✅ Test 5: Sample files (first 5):`)
  files.forEach((file) => {
    console.log(`   📄 ${file.name} (${(file.size / 1024).toFixed(2)} KB) in ${file.folder.name}`)
  })

  console.log('\n✅ All tests passed!\n')

  await prisma.$disconnect()
}

test().catch((error) => {
  console.error('❌ Test failed:', error)
  process.exit(1)
})
