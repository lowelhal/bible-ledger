import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { PrismaModule } from './prisma/prisma.module';
import { BibleModule } from './bible/bible.module';
import { LedgerEntriesModule } from './ledger-entries/ledger-entries.module';
import { NotesModule } from './notes/notes.module';
import { HighlightsModule } from './highlights/highlights.module';
import { StatsModule } from './stats/stats.module';
import { AuthModule } from './auth/auth.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    PrismaModule,
    BibleModule,
    LedgerEntriesModule,
    NotesModule,
    HighlightsModule,
    StatsModule,
    AuthModule,
    SubscriptionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
