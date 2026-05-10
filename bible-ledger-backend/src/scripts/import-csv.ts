/**
 * Import readings from a CSV file into a ReadingFeed.
 * 
 * Usage:
 *   npx ts-node src/scripts/import-csv.ts <feed-slug> <file.csv> [feed-name] [year]
 * 
 * CSV format (with header row):
 *   date,book,chapter,start_verse,end_verse
 *   2026-01-01,GEN,1,1,31
 *   2026-01-02,GEN,2,1,25
 * 
 * Examples:
 *   npx ts-node src/scripts/import-csv.ts our-daily-bread-2026 odb-2026.csv "Our Daily Bread 2026" 2026
 *   npx ts-node src/scripts/import-csv.ts my-reading-plan plan.csv "My Bible Reading Plan"
 */
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  const [,, slugArg, fileArg, nameArg, yearArg] = process.argv;

  if (!slugArg || !fileArg) {
    console.log(`
Usage: npx ts-node src/scripts/import-csv.ts <feed-slug> <file.csv> [feed-name] [year]

CSV format:
  date,book,chapter,start_verse,end_verse
  2026-01-01,GEN,1,1,31
  2026-01-02,GEN,2,1,25
`);
    process.exit(1);
  }

  const filePath = path.resolve(fileArg);
  if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }

  const slug = slugArg;
  const name = nameArg || slug.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const year = yearArg ? parseInt(yearArg) : undefined;

  const csv = fs.readFileSync(filePath, 'utf-8');
  const lines = csv.trim().split('\n').filter(l => l.trim());

  // Skip header row if present
  const header = lines[0].toLowerCase();
  const dataLines = header.includes('date') ? lines.slice(1) : lines;

  console.log(`\n📖 Importing ${dataLines.length} readings into "${name}" (${slug})...\n`);

  const prisma = new PrismaClient();

  try {
    // Create or find the feed
    const feed = await prisma.readingFeed.upsert({
      where: { slug },
      create: { slug, name, year },
      update: { name, year },
    });

    let imported = 0;
    let skipped = 0;

    for (const line of dataLines) {
      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 5) {
        console.log(`  ⚠ Skipping malformed line: ${line}`);
        skipped++;
        continue;
      }

      const [dateStr, book, chapterStr, startVerseStr, endVerseStr] = parts;
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.log(`  ⚠ Invalid date: ${dateStr}`);
        skipped++;
        continue;
      }

      await prisma.feedReading.upsert({
        where: { feed_id_date: { feed_id: feed.id, date } },
        create: {
          feed_id: feed.id,
          date,
          book: book.toUpperCase(),
          chapter: parseInt(chapterStr),
          start_verse: parseInt(startVerseStr),
          end_verse: parseInt(endVerseStr),
        },
        update: {
          book: book.toUpperCase(),
          chapter: parseInt(chapterStr),
          start_verse: parseInt(startVerseStr),
          end_verse: parseInt(endVerseStr),
        },
      });
      imported++;
    }

    console.log(`\n✅ Done! Imported: ${imported}, Skipped: ${skipped}`);
    console.log(`Feed ID: ${feed.id}`);
    console.log(`Slug: ${feed.slug}`);
    console.log(`Total readings in DB: ${await prisma.feedReading.count({ where: { feed_id: feed.id } })}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
