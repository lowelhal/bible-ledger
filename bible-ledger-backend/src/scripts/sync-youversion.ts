/**
 * Sync YouVersion Verse of the Day readings for a full year.
 * 
 * Usage:
 *   npx ts-node src/scripts/sync-youversion.ts [year]
 * 
 * Example:
 *   npx ts-node src/scripts/sync-youversion.ts 2026
 */
import { PrismaClient } from '@prisma/client';

const API_KEY = process.env.YOUVERSION_API_KEY || '8pPq5HE30turCGYDwkAXZLI85M4bSOAa3MtxnVGb6kze8Ldz';
const API_BASE = 'https://api.youversion.com/v1';

interface PassageRef {
  book: string;
  chapter: number;
  start_verse: number;
  end_verse: number;
}

function parseUsfmPassageId(id: string): PassageRef | null {
  if (!id) return null;
  const match = id.match(/^([A-Z0-9]+)\.(\d+)\.(\d+)(?:-(\d+))?$/);
  if (!match) return null;
  return {
    book: match[1],
    chapter: parseInt(match[2]),
    start_verse: parseInt(match[3]),
    end_verse: match[4] ? parseInt(match[4]) : parseInt(match[3]),
  };
}

function getDaysInYear(year: number): number {
  return ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) ? 366 : 365;
}

function dayOfYearToDate(year: number, day: number): Date {
  const d = new Date(year, 0);
  d.setDate(day);
  return d;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  const year = parseInt(process.argv[2]) || new Date().getFullYear();
  const totalDays = getDaysInYear(year);
  const slug = `youversion-votd-${year}`;

  console.log(`\n📖 Syncing YouVersion VOTD for ${year} (${totalDays} days)...\n`);

  const prisma = new PrismaClient();

  try {
    // Create or find the feed
    const feed = await prisma.readingFeed.upsert({
      where: { slug },
      create: { slug, name: `YouVersion Verse of the Day ${year}`, year },
      update: { name: `YouVersion Verse of the Day ${year}`, year },
    });

    console.log(`Feed: ${feed.name} (${feed.id})\n`);

    let synced = 0;
    let skipped = 0;
    let failed = 0;

    for (let day = 1; day <= totalDays; day++) {
      const date = dayOfYearToDate(year, day);
      const dateStr = date.toISOString().slice(0, 10);

      // Check if already exists
      const existing = await prisma.feedReading.findUnique({
        where: { feed_id_date: { feed_id: feed.id, date } },
      });
      if (existing) {
        skipped++;
        if (day % 50 === 0) process.stdout.write(`  [${day}/${totalDays}] skipping existing...\r`);
        continue;
      }

      try {
        const res = await fetch(`${API_BASE}/verse_of_the_days/${day}?version_id=1`, {
          headers: {
            'x-yvp-app-key': API_KEY,
            'Accept': 'application/json',
            'Accept-Language': 'en',
          },
          signal: AbortSignal.timeout(10000),
        });

        if (!res.ok) {
          console.log(`  ⚠ Day ${day} (${dateStr}): API returned ${res.status}`);
          failed++;
          continue;
        }

        const data = await res.json();
        const passage = parseUsfmPassageId(data.passage_id || '');

        if (!passage) {
          console.log(`  ⚠ Day ${day} (${dateStr}): Could not parse passage_id "${data.passage_id}"`);
          failed++;
          continue;
        }

        await prisma.feedReading.create({
          data: {
            feed_id: feed.id,
            date,
            book: passage.book,
            chapter: passage.chapter,
            start_verse: passage.start_verse,
            end_verse: passage.end_verse,
          },
        });

        synced++;
        if (synced % 10 === 0 || day === totalDays) {
          process.stdout.write(`  ✓ ${synced} synced, ${skipped} skipped, ${failed} failed [${day}/${totalDays}]\r`);
        }

        // Rate limit: ~200ms between requests
        await sleep(200);
      } catch (err: any) {
        console.log(`  ✗ Day ${day} (${dateStr}): ${err.message}`);
        failed++;
      }
    }

    console.log(`\n\n✅ Done! Synced: ${synced}, Skipped: ${skipped}, Failed: ${failed}\n`);
    console.log(`Feed ID: ${feed.id}`);
    console.log(`Slug: ${feed.slug}`);
    console.log(`Total readings in DB: ${await prisma.feedReading.count({ where: { feed_id: feed.id } })}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
