import { Controller, Get, Post, Body, Param, Delete, Query } from '@nestjs/common';
import { HighlightsService } from './highlights.service';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('highlights')
@Controller('v1/highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Post()
  @ApiOperation({ summary: 'Record a new highlight.' })
  create(@Body() createHighlightDto: CreateHighlightDto) {
    return this.highlightsService.create(createHighlightDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve highlights (supports overlaps).' })
  @ApiQuery({ name: 'user_id', required: true, type: String })
  @ApiQuery({ name: 'book', required: false, type: String })
  findAll(
    @Query('user_id') user_id: string,
    @Query('book') book?: string,
  ) {
    return this.highlightsService.findAll(user_id, book);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a highlight by ID.' })
  remove(@Param('id') id: string) {
    return this.highlightsService.remove(id);
  }
}
