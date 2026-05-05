/**
 * Prisma seed script — runs on first deploy via `prisma db push` + `prisma db seed`
 * Creates admin user with bcrypt-hashed password.
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Seeding database...')

  // Admin user
  const adminHash = await bcrypt.hash('admin', 10)

  await prisma.user.upsert({
    where: { email: 'admin@bitconverter.com' },
    update: {},
    create: {
      email: 'admin@bitconverter.com',
      name: 'Administrador',
      password: adminHash,
      role: 'admin',
    },
  })

  await prisma.user.upsert({
    where: { email: 'admin' },
    update: {},
    create: {
      email: 'admin',
      name: 'Admin',
      password: adminHash,
      role: 'admin',
    },
  })

  // Default config
  await prisma.config.upsert({
    where: { id: 'global' },
    update: {},
    create: { id: 'global' },
  })

  console.log('✅ Seed complete — admin@bitconverter.com / admin')
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
