import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerEntriesService } from '../ledger-entries/ledger-entries.service';
import { Source, Status } from '@prisma/client';
import { CreateHighlightDto } from './dto/create-highlight.dto';

@Injectable()
export class HighlightsService {
  constructor(
    private prisma: PrismaService,
    private ledgerEntriesService: LedgerEntriesService
  ) {}

  async create(createHighlightDto: CreateHighlightDto) {
    const { passage, ...rest } = createHighlightDto;
    
    const highlight = await this.prisma.highlight.create({
      data: {
        ...rest,
        book: passage.book,
        chapter: passage.chapter,
        start_verse: passage.start_verse,
        end_verse: passage.end_verse,
        verse_ids: passage.verse_ids || [],
      },
    });

    try {
      // Always route through the service — it handles deduplication and merging internally
      await this.ledgerEntriesService.create({
        user_id: rest.user_id,
        source: Source.SYSTEM_AUTO,
        status: Status.CONFIRMED,
        passage: {
          book: passage.book,
          chapter: passage.chapter,
          start_verse: passage.start_verse,
          end_verse: passage.end_verse,
        },
        start_time: new Date().toISOString()
      });
    } catch (err) {
      console.error('Failed to auto-create ledger entry for highlight:', err);
    }

    return highlight;
  }

  async findAll(user_id: string, book?: string) {
    const where: any = { user_id };
    if (book) where.book = book;

    const highlights = await this.prisma.highlight.findMany({ where });

    return highlights.map((hl) => ({
      id: hl.id,
      user_id: hl.user_id,
      color_hex: hl.color_hex,
      tags: hl.tags,
      source: hl.source,
      passage: {
        book: hl.book,
        chapter: hl.chapter,
        start_verse: hl.start_verse,
        end_verse: hl.end_verse,
        verse_ids: hl.verse_ids,
      },
    }));
  }

  async remove(id: string) {
    return this.prisma.highlight.delete({
      where: { id },
    });
  }
}
