import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { Status } from '@prisma/client';

@Injectable()
export class LedgerEntriesService {
  constructor(private prisma: PrismaService) { }

  private async resolveStatus(userId: string, source: string): Promise<Status> {
    // Subscription-sourced entries use auto_confirm_subscriptions setting
    // User-sourced entries use auto_confirm_readings setting
    const settings = await this.prisma.userSettings.findUnique({ where: { user_id: userId } });
    if (!settings) return Status.CONFIRMED; // default: auto-confirm

    const isSubscription = source === 'EXTERNAL_RSS' || source === 'API_INTEGRATION';
    if (isSubscription) {
      return settings.auto_confirm_subscriptions ? Status.CONFIRMED : Status.PENDING;
    }
    return settings.auto_confirm_readings ? Status.CONFIRMED : Status.PENDING;
  }

  async create(createLedgerEntryDto: CreateLedgerEntryDto) {
    const { passage, ...rest } = createLedgerEntryDto;

    // Resolve the time range of the incoming entry
    const incomingStart = rest.start_time ? new Date(rest.start_time) : new Date();
    const incomingEnd = new Date();
    const status = await this.resolveStatus(rest.user_id, rest.source); // treat "now" as end of the incoming event

    const SESSION_GAP_MS = 60 * 60 * 1000; // 60-minute idle gap = different session

    // Fetch candidates: a generous lookback window (25 hrs before incoming start)
    // so offline/late uploads are included.  We filter by session gap in memory.
    const lookbackStart = new Date(incomingStart.getTime() - SESSION_GAP_MS - 24 * 60 * 60 * 1000);

    const candidates = await this.prisma.ledgerEntry.findMany({
      where: {
        user_id: rest.user_id,
        book: passage.book,
        chapter: passage.chapter,
        OR: [
          { start_time: { gte: lookbackStart } },
          { end_time: { gte: lookbackStart } },
        ]
      },
      orderBy: { start_verse: 'asc' }
    });

    // Filter: keep only entries whose time interval is within SESSION_GAP_MS of the
    // incoming interval.  Gap = time between the two intervals; 0 means they overlap.
    // This comparison is entry-time-relative, not wall-clock-relative, so late uploads work.
    const sameSession = candidates.filter(e => {
      const eStart = e.start_time?.getTime() ?? incomingStart.getTime();
      const eEnd = (e.end_time ?? e.start_time)?.getTime() ?? incomingEnd.getTime();
      const gap = Math.max(
        0,
        Math.max(eStart, incomingStart.getTime()) - Math.min(eEnd, incomingEnd.getTime())
      );
      return gap <= SESSION_GAP_MS;
    });

    // 1. Exact duplicate suppression:
    //    Same verse range AND start_time within 5 minutes of each other
    const exactDup = sameSession.find(e =>
      e.start_verse === passage.start_verse &&
      e.end_verse === passage.end_verse &&
      e.start_time &&
      Math.abs(e.start_time.getTime() - incomingStart.getTime()) < 5 * 60 * 1000
    );
    if (exactDup) return exactDup;

    // 2. Collect ALL entries whose verse range overlaps or is contiguous with incoming
    const overlapping = sameSession.filter(e =>
      Math.max(e.start_verse, passage.start_verse) <= Math.min(e.end_verse, passage.end_verse) + 1
    );

    if (overlapping.length === 0) {
      // No overlap — start a fresh entry
      const entry = await this.prisma.ledgerEntry.create({
        data: {
          ...rest,
          status,
          start_time: incomingStart,
          end_time: incomingEnd,
          book: passage.book,
          chapter: passage.chapter,
          start_verse: passage.start_verse,
          end_verse: passage.end_verse,
          verse_ids: passage.verse_ids || [],
        },
      });
      this.recalculateUserStats(entry.user_id).catch(console.error);
      return entry;
    }

    // 3. Compute the union verse range across all overlapping entries + incoming
    const mergedStart = Math.min(...overlapping.map(e => e.start_verse), passage.start_verse);
    const mergedEnd = Math.max(...overlapping.map(e => e.end_verse), passage.end_verse);

    // 4. Compute the union time range:
    //    earliest start_time across all (preserves original reading start)
    //    latest end_time across all + incoming (reflects how long reading lasted)
    const earliestStart = new Date(Math.min(
      ...overlapping.map(e => e.start_time?.getTime() ?? incomingStart.getTime()),
      incomingStart.getTime()
    ));
    const latestEnd = new Date(Math.max(
      ...overlapping.map(e => (e.end_time ?? e.start_time)?.getTime() ?? incomingEnd.getTime()),
      incomingEnd.getTime()
    ));

    // 5. Keep the entry with the earliest start_time; delete absorbed extras
    const sorted = [...overlapping].sort((a, b) =>
      (a.start_time?.getTime() ?? 0) - (b.start_time?.getTime() ?? 0)
    );
    const keeper = sorted[0];
    const toDelete = sorted.slice(1).map(e => e.id);

    if (toDelete.length > 0) {
      await this.prisma.ledgerEntry.deleteMany({ where: { id: { in: toDelete } } });
    }

    const updated = await this.prisma.ledgerEntry.update({
      where: { id: keeper.id },
      data: {
        start_verse: mergedStart,
        end_verse: mergedEnd,
        start_time: earliestStart, // earliest across all merged — original reading start
        end_time: latestEnd,     // latest across all merged — total reading span
      }
    });

    this.recalculateUserStats(updated.user_id).catch(console.error);
    return updated;
  }


  async createBulk(createLedgerEntryDtos: CreateLedgerEntryDto[]) {
    if (createLedgerEntryDtos.length === 0) return { count: 0 };
    // Just process them sequentially so merging logic applies correctly.
    // This is safe since bulk batches from frontend are usually small (2-5 ranges).
    let count = 0;
    for (const dto of createLedgerEntryDtos) {
      await this.create(dto);
      count++;
    }
    return { count };
  }

  async recalculateUserStats(user_id: string) {
    const entries = await this.prisma.ledgerEntry.findMany({
      where: { user_id, status: 'CONFIRMED' },
      orderBy: { start_time: 'desc' }
    });

    // Count unique verses
    const uniqueVersesSet = new Set<string>();
    const chaptersSet = new Set<string>();
    const readDatesSet = new Set<string>(); // 'YYYY-MM-DD' per day

    for (const entry of entries) {
      for (let i = entry.start_verse; i <= entry.end_verse; i++) {
        uniqueVersesSet.add(`${entry.book}-${entry.chapter}-${i}`);
      }
      chaptersSet.add(`${entry.book}-${entry.chapter}`);
      if (entry.start_time) {
        // Normalise to local date string to group multiple sessions on same day
        const dateKey = entry.start_time.toISOString().slice(0, 10);
        readDatesSet.add(dateKey);
      }
    }

    // Calculate consecutive streak backwards from today
    const todayStr = new Date().toISOString().slice(0, 10);
    let currentStreak = 0;
    let checkDate = new Date();

    while (true) {
      const dateKey = checkDate.toISOString().slice(0, 10);
      if (readDatesSet.has(dateKey)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (dateKey === todayStr) {
        // Today not yet read — check yesterday before breaking
        checkDate.setDate(checkDate.getDate() - 1);
        const yesterdayKey = checkDate.toISOString().slice(0, 10);
        if (!readDatesSet.has(yesterdayKey)) break; // streak is 0
      } else {
        break;
      }
    }

    const totalVerses = uniqueVersesSet.size;
    const lastRead = entries.length > 0 ? entries[0].start_time || new Date() : null;

    // Fetch existing to preserve longest_streak
    const existing = await this.prisma.userStats.findUnique({ where: { user_id } });
    const longestStreak = Math.max(currentStreak, existing?.longest_streak || 0);

    await this.prisma.userStats.upsert({
      where: { user_id },
      create: {
        user_id,
        total_verses_read: totalVerses,
        chapters_read: chaptersSet.size,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_read_date: lastRead,
      },
      update: {
        total_verses_read: totalVerses,
        chapters_read: chaptersSet.size,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_read_date: lastRead,
      }
    });
  }

  async findAll(filters: {
    user_id: string;
    start_date?: string;
    end_date?: string;
    book?: string;
    chapter?: number;
    status?: Status;
    tags?: string[];
  }) {
    const { user_id, start_date, end_date, book, chapter, status, tags } = filters;

    const where: any = { user_id };

    if (start_date || end_date) {
      where.start_time = {};
      if (start_date) where.start_time.gte = new Date(start_date);
      if (end_date) where.start_time.lte = new Date(end_date);
    }

    if (book) where.book = book;
    if (chapter) where.chapter = Number(chapter);
    if (status) where.status = status;
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const entries = await this.prisma.ledgerEntry.findMany({
      where,
      orderBy: { start_time: 'desc' },
    });

    return entries.map((entry) => ({
      id: entry.id,
      user_id: entry.user_id,
      status: entry.status,
      source: entry.source,
      start_time: entry.start_time,
      end_time: entry.end_time,
      translation_id: entry.translation_id,
      tags: entry.tags,
      passage: {
        book: entry.book,
        chapter: entry.chapter,
        start_verse: entry.start_verse,
        end_verse: entry.end_verse,
        verse_ids: entry.verse_ids,
      },
    }));
  }
}
