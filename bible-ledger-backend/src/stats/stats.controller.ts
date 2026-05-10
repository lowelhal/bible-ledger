import { Controller, Get, Query } from '@nestjs/common';
import { StatsService } from './stats.service';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';

@ApiTags('stats')
@Controller('v1/stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  @ApiOperation({ summary: 'Retrieve hierarchical completion and heatmap data.' })
  @ApiQuery({ name: 'user_id', required: true, type: String })
  getSummary(@Query('user_id') user_id: string) {
    return this.statsService.getSummary(user_id);
  }
}
