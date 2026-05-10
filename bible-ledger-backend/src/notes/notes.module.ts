import { Module } from '@nestjs/common';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

import { LedgerEntriesModule } from '../ledger-entries/ledger-entries.module';

@Module({
  imports: [LedgerEntriesModule],
  controllers: [NotesController],
  providers: [NotesService]
})
export class NotesModule {}
