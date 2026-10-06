import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SynchronizationService } from './synchronization.service';
import { SyncDto, BatchSyncDto } from '../actions/dto/batch-sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

/**
 * Endpoint de synchronisation canonique : POST /sync
 * Un alias POST /actions/sync est conservé pour les clients déjà déployés.
 */
@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SynchronizationController {
  constructor(
    private readonly synchronizationService: SynchronizationService,
  ) {}

  /** Traitement d'une file d'actions : 200 (aucune ressource créée). */
  @Post()
  @HttpCode(HttpStatus.OK)
  synchronize(@Body() dto: SyncDto, @CurrentUser() user: AuthenticatedUser) {
    return this.synchronizationService.synchronize(user.id, dto);
  }
}

@Controller('actions')
@UseGuards(JwtAuthGuard)
export class ActionsSyncAliasController {
  constructor(
    private readonly synchronizationService: SynchronizationService,
  ) {}

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  sync(@Body() dto: SyncDto, @CurrentUser() user: AuthenticatedUser) {
    return this.synchronizationService.synchronize(user.id, dto);
  }

  @Post('batch-sync')
  @HttpCode(HttpStatus.OK)
  batchSync(@Body() dto: BatchSyncDto, @CurrentUser() user: AuthenticatedUser) {
    return this.synchronizationService.synchronize(user.id, dto);
  }
}
