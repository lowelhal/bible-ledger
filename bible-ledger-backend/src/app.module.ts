import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { LedgerEntriesModule } from './ledger-entries/ledger-entries.module';
import { NotesModule } from './notes/notes.module';
import { HighlightsModule } from './highlights/highlights.module';
import { StatsModule } from './stats/stats.module';
import { BibleModule } from './bible/bible.module';
import { AuthModule } from './auth/auth.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [PrismaModule, LedgerEntriesModule, NotesModule, HighlightsModule, StatsModule, BibleModule, AuthModule, SubscriptionsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
