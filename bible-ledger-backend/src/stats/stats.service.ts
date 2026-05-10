import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatsService {
  constructor(private prisma: PrismaService) {}

  async getSummary(user_id: string) {
    const stats = await this.prisma.userStats.findUnique({
      where: { user_id }
    });

    if (!stats) {
      return {
        total_verses_read: 0,
        chapters_read: 0,
        current_streak: 0,
        longest_streak: 0,
      };
    }

    return {
      total_verses_read: stats.total_verses_read,
      chapters_read: stats.chapters_read,
      current_streak: stats.current_streak,
      longest_streak: stats.longest_streak,
      last_read_date: stats.last_read_date,
    };
  }
}
