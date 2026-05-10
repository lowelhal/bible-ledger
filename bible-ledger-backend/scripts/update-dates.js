const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const now = new Date();

  // Update LedgerEntries
  await prisma.ledgerEntry.updateMany({
    data: {
      start_time: now,
    },
  });
  console.log('Updated LedgerEntries');

  // Update Notes
  await prisma.note.updateMany({
    data: {
      created_at: now,
    },
  });
  console.log('Updated Notes');

  // Update UserStats
  await prisma.userStats.updateMany({
    data: {
      last_read_date: now,
    },
  });
  console.log('Updated UserStats');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
