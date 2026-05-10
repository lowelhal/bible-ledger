const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = ['user-123']; // Currently we only use this
  
  for (const user_id of users) {
    const entries = await prisma.ledgerEntry.findMany({
      where: { user_id, status: 'CONFIRMED' },
      orderBy: { start_time: 'desc' }
    });

    const uniqueVersesSet = new Set();
    const chaptersSet = new Set();

    for (const entry of entries) {
      for (let i = entry.start_verse; i <= entry.end_verse; i++) {
        uniqueVersesSet.add(`${entry.book}-${entry.chapter}-${i}`);
      }
      chaptersSet.add(`${entry.book}-${entry.chapter}`);
    }

    const totalVerses = uniqueVersesSet.size;
    const currentStreak = entries.length > 0 ? 1 : 0; 
    const lastRead = entries.length > 0 ? entries[0].start_time || new Date() : null;

    await prisma.userStats.upsert({
      where: { user_id },
      create: {
        user_id,
        total_verses_read: totalVerses,
        chapters_read: chaptersSet.size,
        current_streak: currentStreak,
        longest_streak: currentStreak,
        last_read_date: lastRead,
      },
      update: {
        total_verses_read: totalVerses,
        chapters_read: chaptersSet.size,
        current_streak: currentStreak,
        longest_streak: currentStreak,
        last_read_date: lastRead,
      }
    });
    
    console.log(`Updated stats for ${user_id}: ${totalVerses} unique verses, ${chaptersSet.size} chapters`);
  }
}

main().finally(() => prisma.$disconnect());
