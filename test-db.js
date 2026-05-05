const path = require('path');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const { PrismaClient } = require('@prisma/client');

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
console.log('DB path:', dbPath);

const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
const prisma = new PrismaClient({ adapter });

async function test() {
  try {
    const clockCount = await prisma.clock.count();
    console.log('Clock count:', clockCount);
    const empCount = await prisma.employee.count();
    console.log('Employee count:', empCount);
    console.log('SUCCESS!');
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}
test();
