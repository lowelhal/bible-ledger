import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { LedgerEntriesService } from './ledger-entries.service';
import { CreateLedgerEntryDto } from './dto/create-ledger-entry.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Status } from '@prisma/client';

@ApiTags('ledger-entries')
@Controller('v1/ledger-entries')
export class LedgerEntriesController {
  constructor(private readonly ledgerEntriesService: LedgerEntriesService) {}

  @Post()
  @ApiOperation({ summary: 'Append a new reading event to the ledger.' })
  create(@Body() createLedgerEntryDto: CreateLedgerEntryDto) {
    return this.ledgerEntriesService.create(createLedgerEntryDto);
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Batch append multiple entries.' })
  createBulk(@Body() createLedgerEntryDtos: CreateLedgerEntryDto[]) {
    return this.ledgerEntriesService.createBulk(createLedgerEntryDtos);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve ledger history with precision filtering.' })
  @ApiQuery({ name: 'user_id', required: true, type: String })
  @ApiQuery({ name: 'start_date', required: false, type: String })
  @ApiQuery({ name: 'end_date', required: false, type: String })
  @ApiQuery({ name: 'book', required: false, type: String })
  @ApiQuery({ name: 'chapter', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, enum: Status })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  findAll(
    @Query('user_id') user_id: string,
    @Query('start_date') start_date?: string,
    @Query('end_date') end_date?: string,
    @Query('book') book?: string,
    @Query('chapter') chapter?: number,
    @Query('status') status?: Status,
    @Query('tags') tags?: string | string[],
  ) {
    const tagsArray = typeof tags === 'string' ? [tags] : tags;
    return this.ledgerEntriesService.findAll({
      user_id,
      start_date,
      end_date,
      book,
      chapter,
      status,
      tags: tagsArray,
    });
  }
}
