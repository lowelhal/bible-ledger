import { Module } from '@nestjs/common';
import { HighlightsController } from './highlights.controller';
import { HighlightsService } from './highlights.service';

import { LedgerEntriesModule } from '../ledger-entries/ledger-entries.module';

@Module({
  imports: [LedgerEntriesModule],
  controllers: [HighlightsController],
  providers: [HighlightsService]
})
export class HighlightsModule {}
