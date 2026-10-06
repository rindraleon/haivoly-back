import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ActionsService } from './actions.service';
import { CreateActionDto } from './dto/create-action.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

class ActionQueryDto extends PaginationQueryDto {
  userId?: string;
  actionType?: string;
  entityType?: string;
  syncStatus?: string;
  q?: string;
  search?: string;
}

@Controller('actions')
@UseGuards(JwtAuthGuard)
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Post()
  create(@Body() dto: CreateActionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.actionsService.create(user.id, dto);
  }

  @Get('stats/dashboard')
  stats() {
    return this.actionsService.stats();
  }

  @Get('me/failed')
  failed(@CurrentUser() user: AuthenticatedUser) {
    return this.actionsService.failedForUser(user.id);
  }

  @Get()
  findAll(
    @Query() query: ActionQueryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.actionsService.findAll({
      ...query,
      search: query.q ?? query.search,
      // Un utilisateur ne voit que ses propres actions.
      userId: user.id,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.actionsService.findOne(id);
  }
}
