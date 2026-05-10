const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const stats = await prisma.userStats.findMany();
  console.log('Stats:', stats);
  
  const entries = await prisma.ledgerEntry.findMany();
  console.log('Entries count:', entries.length);
}

main().finally(() => prisma.$disconnect());
