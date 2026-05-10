import { Controller, Get, Param, Query } from '@nestjs/common';
import { BibleService } from './bible.service';
import { ApiTags, ApiOperation, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('bible')
@Controller('v1/bible')
export class BibleController {
  constructor(private readonly bibleService: BibleService) {}

  @Get('translations')
  @ApiOperation({ summary: 'List available Bible translations.' })
  getTranslations() {
    return this.bibleService.getTranslations();
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for text within a specific translation (KJV default).' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'translation_id', required: false, type: String, default: 'KJV' })
  search(
    @Query('q') q: string,
    @Query('translation_id') translationId?: string,
  ) {
    return this.bibleService.search(q, translationId || 'KJV');
  }

  @Get(':translation_id/passage')
  @ApiOperation({ summary: 'Fetch text for a specific chapter or verse range.' })
  @ApiParam({ name: 'translation_id', required: true, type: String })
  @ApiQuery({ name: 'book', required: true, type: String })
  @ApiQuery({ name: 'chapter', required: true, type: Number })
  @ApiQuery({ name: 'start_verse', required: false, type: Number })
  @ApiQuery({ name: 'end_verse', required: false, type: Number })
  getPassage(
    @Param('translation_id') translationId: string,
    @Query('book') book: string,
    @Query('chapter') chapter: number,
    @Query('start_verse') startVerse?: number,
    @Query('end_verse') endVerse?: number,
  ) {
    return this.bibleService.getPassage(
      translationId,
      book,
      Number(chapter),
      startVerse ? Number(startVerse) : undefined,
      endVerse ? Number(endVerse) : undefined,
    );
  }
}
