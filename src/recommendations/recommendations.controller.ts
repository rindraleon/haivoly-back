/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { RecommendationsService } from './recommendations.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('recommendations')
@UseGuards(JwtAuthGuard)
export class RecommendationsController {
  constructor(private readonly recos: RecommendationsService) {}

  @Post()
  async create(@Body() dto: CreateRecommendationDto) {
    return this.recos.create(dto);
  }

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('unread') unread?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.recos.findAll({
      userId,
      type,
      priority,
      unread,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Get('me')
  async forMe(@Request() req: any, @Query('unreadOnly') unreadOnly?: string) {
    return this.recos.findForUser(req.user.id, unreadOnly !== 'true');
  }

  @Patch(':id/read')
  async markRead(@Param('id') id: string) {
    return this.recos.markRead(id);
  }

  @Patch('read-all')
  async markAllRead(@Request() req: any) {
    return this.recos.markAllReadForUser(req.user.id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.recos.remove(id);
  }
}
