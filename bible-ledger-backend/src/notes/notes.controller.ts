import { Controller, Get, Post, Body, Put, Param, Delete, Query } from '@nestjs/common';
import { NotesService } from './notes.service';
import { CreateNoteDto, UpdateNoteDto } from './dto/note.dto';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('notes')
@Controller('v1/notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Post()
  @ApiOperation({ summary: 'Add a new note to a passage.' })
  create(@Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(createNoteDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve personal notes.' })
  @ApiQuery({ name: 'user_id', required: true, type: String })
  @ApiQuery({ name: 'book', required: false, type: String })
  @ApiQuery({ name: 'tags', required: false, type: [String] })
  findAll(
    @Query('user_id') user_id: string,
    @Query('book') book?: string,
    @Query('tags') tags?: string | string[],
  ) {
    const tagsArray = typeof tags === 'string' ? [tags] : tags;
    return this.notesService.findAll({ user_id, book, tags: tagsArray });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update note content or tags.' })
  update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(id, updateNoteDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a note.' })
  remove(@Param('id') id: string) {
    return this.notesService.remove(id);
  }
}
