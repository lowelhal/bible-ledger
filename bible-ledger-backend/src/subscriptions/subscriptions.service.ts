import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Status } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(private prisma: PrismaService) {}

  // ─── Reading Feeds ─────────────────────────────────────────────────────

  async getAvailableFeeds() {
    return this.prisma.readingFeed.findMany({
      include: { _count: { select: { readings: true, subscriptions: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async createFeed(slug: string, name: string, year?: number) {
    return this.prisma.readingFeed.upsert({
      where: { slug },
      create: { slug, name, year },
      update: { name, year },
    });
  }

  async importReadings(
    feedId: string,
    readings: { date: string; book: string; chapter: number; start_verse: number; end_verse: number }[],
  ): Promise<{ imported: number }> {
    let imported = 0;

    for (const r of readings) {
      await this.prisma.feedReading.upsert({
        where: { feed_id_date: { feed_id: feedId, date: new Date(r.date) } },
        create: {
          feed_id: feedId,
          date: new Date(r.date),
          book: r.book,
          chapter: r.chapter,
          start_verse: r.start_verse,
          end_verse: r.end_verse,
        },
        update: {
          book: r.book,
          chapter: r.chapter,
          start_verse: r.start_verse,
          end_verse: r.end_verse,
        },
      });
      imported++;
    }

    return { imported };
  }

  async getFeedReadings(feedId: string, limit = 30) {
    return this.prisma.feedReading.findMany({
      where: { feed_id: feedId },
      orderBy: { date: 'asc' },
      take: limit,
    });
  }

  // ─── Auto-generate Ledger Entries from Subscriptions ───────────────────

  async processSubscriptionsForUser(userId: string): Promise<{ created: number; pending: number }> {
    const subs = await this.prisma.subscription.findMany({
      where: { user_id: userId, enabled: true },
      include: { feed: true },
    });

    const settings = await this.prisma.userSettings.findUnique({ where: { user_id: userId } });
    const autoConfirm = settings?.auto_confirm_subscriptions ?? false;
    const status = autoConfirm ? Status.CONFIRMED : Status.PENDING;

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    // Build a date-only value for DB lookup (midnight UTC)
    const todayDate = new Date(`${todayStr}T00:00:00Z`);

    let created = 0;
    let pending = 0;

    for (const sub of subs) {
      // Check if we already created an entry for this feed today
      const existing = await this.prisma.ledgerEntry.findFirst({
        where: {
          user_id: userId,
          source: 'API_INTEGRATION',
          tags: { has: `feed:${sub.feed.slug}` },
          start_time: { gte: new Date(`${todayStr}T00:00:00Z`), lte: new Date(`${todayStr}T23:59:59Z`) },
        },
      });
      if (existing) continue;

      // Look up today's reading from the feed
      const reading = await this.prisma.feedReading.findUnique({
        where: { feed_id_date: { feed_id: sub.feed_id, date: todayDate } },
      });
      if (!reading) continue;

      await this.prisma.ledgerEntry.create({
        data: {
          user_id: userId,
          source: 'API_INTEGRATION',
          status,
          start_time: new Date(),
          end_time: new Date(),
          book: reading.book,
          chapter: reading.chapter,
          start_verse: reading.start_verse,
          end_verse: reading.end_verse,
          verse_ids: [],
          tags: [`feed:${sub.feed.slug}`, `auto:${todayStr}`],
        },
      });

      if (status === 'PENDING') pending++;
      else created++;
    }

    return { created, pending };
  }

  // ─── Pending Entries Management ────────────────────────────────────────

  async getPendingEntries(userId: string) {
    return this.prisma.ledgerEntry.findMany({
      where: { user_id: userId, status: 'PENDING' },
      orderBy: { start_time: 'desc' },
    });
  }

  async confirmEntry(entryId: string) {
    return this.prisma.ledgerEntry.update({
      where: { id: entryId },
      data: { status: 'CONFIRMED' },
    });
  }

  async confirmAllPending(userId: string) {
    return this.prisma.ledgerEntry.updateMany({
      where: { user_id: userId, status: 'PENDING' },
      data: { status: 'CONFIRMED' },
    });
  }

  async rejectEntry(entryId: string) {
    return this.prisma.ledgerEntry.delete({ where: { id: entryId } });
  }

  // ─── Subscription Management ───────────────────────────────────────────

  async getUserSubscriptions(userId: string) {
    return this.prisma.subscription.findMany({
      where: { user_id: userId },
      include: { feed: true },
    });
  }

  async toggleSubscription(userId: string, feedId: string, enabled: boolean) {
    return this.prisma.subscription.upsert({
      where: { user_id_feed_id: { user_id: userId, feed_id: feedId } },
      create: { user_id: userId, feed_id: feedId, enabled },
      update: { enabled },
    });
  }

  // ─── User Settings ─────────────────────────────────────────────────────

  async getUserSettings(userId: string) {
    const settings = await this.prisma.userSettings.findUnique({ where: { user_id: userId } });
    return settings || { user_id: userId, auto_confirm_readings: true, auto_confirm_subscriptions: false };
  }

  async updateUserSettings(userId: string, data: {
    auto_confirm_readings?: boolean;
    auto_confirm_subscriptions?: boolean;
  }) {
    return this.prisma.userSettings.upsert({
      where: { user_id: userId },
      create: { user_id: userId, ...data },
      update: data,
    });
  }
}
