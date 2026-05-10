import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LedgerEntriesService } from '../ledger-entries/ledger-entries.service';
import { Source, Status } from '@prisma/client';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';

@Injectable()
export class NotesService {
  constructor(
    private prisma: PrismaService,
    private ledgerEntriesService: LedgerEntriesService
  ) {}

  async create(createNoteDto: CreateNoteDto) {
    const { passage, ...rest } = createNoteDto;
    
    const note = await this.prisma.note.create({
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
      console.error('Failed to auto-create ledger entry for note:', err);
    }

    return note;
  }

  async findAll(filters: { user_id: string; book?: string; tags?: string[] }) {
    const { user_id, book, tags } = filters;
    const where: any = { user_id };

    if (book) where.book = book;
    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    const notes = await this.prisma.note.findMany({ where, orderBy: { created_at: 'desc' } });

    return notes.map((note) => ({
      id: note.id,
      user_id: note.user_id,
      source: note.source,
      content: note.content,
      tags: note.tags,
      created_at: note.created_at,
      updated_at: note.updated_at,
      passage: {
        book: note.book,
        chapter: note.chapter,
        start_verse: note.start_verse,
        end_verse: note.end_verse,
        verse_ids: note.verse_ids,
      },
    }));
  }

  async update(id: string, updateNoteDto: UpdateNoteDto) {
    return this.prisma.note.update({
      where: { id },
      data: updateNoteDto,
    });
  }

  async remove(id: string) {
    return this.prisma.note.delete({
      where: { id },
    });
  }
}
