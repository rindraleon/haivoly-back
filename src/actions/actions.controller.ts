/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { BatchSyncDto } from './dto/batch-sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('actions')
@UseGuards(JwtAuthGuard)
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post()
  async create(@Request() req: any, @Body() dto: CreateActionDto) {
    return this.actionsService.create(req.user.id, dto);
  }

  @Post('batch-sync')
  async batchSync(@Request() req: any, @Body() dto: BatchSyncDto) {
    return this.actionsService.batchSync(req.user.id, dto.actions);
  }

  // Alias for mobile sync engine (POST /actions/sync)
  @Post('sync')
  async sync(@Request() req: any, @Body() dto: BatchSyncDto) {
    return this.actionsService.batchSync(req.user.id, dto.actions);
  }

  @Get('stats/dashboard')
  async dashboard() {
    return this.actionsService.getDashboardStats();
  }

  @Get()
  async findAll(
    @Query('userId') userId?: string,
    @Query('actionType') actionType?: string,
    @Query('entityType') entityType?: string,
    @Query('syncStatus') syncStatus?: string,
    @Query('q') q?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sort') sort?: string,
  ) {
    return this.actionsService.findAll({
      userId,
      actionType,
      entityType,
      syncStatus,
      search: q ?? search,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.actionsService.findOne(id);
  }
}
