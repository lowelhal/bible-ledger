import { Controller, Get, Post, Body, Query, Put, Param, Delete } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('subscriptions')
@Controller('v1/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  // ─── Reading Feeds ─────────────────────────────────────────────────────

  @Get('feeds')
  @ApiOperation({ summary: 'List all available reading feeds.' })
  getAvailableFeeds() {
    return this.subscriptionsService.getAvailableFeeds();
  }

  @Post('feeds')
  @ApiOperation({ summary: 'Create or update a reading feed.' })
  createFeed(@Body() body: { slug: string; name: string; year?: number }) {
    return this.subscriptionsService.createFeed(body.slug, body.name, body.year);
  }

  @Post('feeds/:id/import')
  @ApiOperation({ summary: 'Bulk import readings into a feed.' })
  importReadings(
    @Param('id') feedId: string,
    @Body() body: { readings: { date: string; book: string; chapter: number; start_verse: number; end_verse: number }[] },
  ) {
    return this.subscriptionsService.importReadings(feedId, body.readings);
  }

  @Get('feeds/:id/readings')
  @ApiOperation({ summary: 'Get readings for a feed.' })
  getFeedReadings(@Param('id') feedId: string, @Query('limit') limit?: string) {
    return this.subscriptionsService.getFeedReadings(feedId, limit ? parseInt(limit) : 30);
  }

  // ─── Auto-generate subscription entries ────────────────────────────────

  @Post('process')
  @ApiOperation({ summary: 'Process active subscriptions and auto-generate ledger entries for today.' })
  processSubscriptions(@Body() body: { user_id: string }) {
    return this.subscriptionsService.processSubscriptionsForUser(body.user_id);
  }

  // ─── Pending Entries ───────────────────────────────────────────────────

  @Get('pending')
  @ApiOperation({ summary: 'Get all pending (unconfirmed) ledger entries for a user.' })
  @ApiQuery({ name: 'user_id', required: true, type: String })
  getPendingEntries(@Query('user_id') userId: string) {
    return this.subscriptionsService.getPendingEntries(userId);
  }

  @Post('confirm/:id')
  @ApiOperation({ summary: 'Confirm a single pending ledger entry.' })
  confirmEntry(@Param('id') id: string) {
    return this.subscriptionsService.confirmEntry(id);
  }

  @Post('confirm-all')
  @ApiOperation({ summary: 'Confirm all pending entries for a user.' })
  confirmAll(@Body() body: { user_id: string }) {
    return this.subscriptionsService.confirmAllPending(body.user_id);
  }

  @Delete('pending/:id')
  @ApiOperation({ summary: 'Reject (delete) a pending ledger entry.' })
  rejectEntry(@Param('id') id: string) {
    return this.subscriptionsService.rejectEntry(id);
  }

  // ─── Subscription Management ───────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Get user subscriptions with feed details.' })
  @ApiQuery({ name: 'user_id', required: true, type: String })
  getUserSubscriptions(@Query('user_id') userId: string) {
    return this.subscriptionsService.getUserSubscriptions(userId);
  }

  @Post('toggle')
  @ApiOperation({ summary: 'Toggle a feed subscription on/off.' })
  toggleSubscription(@Body() body: { user_id: string; feed_id: string; enabled: boolean }) {
    return this.subscriptionsService.toggleSubscription(body.user_id, body.feed_id, body.enabled);
  }

  // ─── User Settings ─────────────────────────────────────────────────────

  @Get('settings')
  @ApiOperation({ summary: 'Get user tracking settings.' })
  @ApiQuery({ name: 'user_id', required: true, type: String })
  getUserSettings(@Query('user_id') userId: string) {
    return this.subscriptionsService.getUserSettings(userId);
  }

  @Put('settings')
  @ApiOperation({ summary: 'Update user tracking settings.' })
  updateUserSettings(@Body() body: {
    user_id: string;
    auto_confirm_readings?: boolean;
    auto_confirm_subscriptions?: boolean;
  }) {
    return this.subscriptionsService.updateUserSettings(body.user_id, {
      auto_confirm_readings: body.auto_confirm_readings,
      auto_confirm_subscriptions: body.auto_confirm_subscriptions,
    });
  }
}
