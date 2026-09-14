import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { SyncService } from './sync.service';
import { SyncDto } from './dto/sync.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async synchronize(
    @Req() req: any,
    @Body() dto: SyncDto,
  ) {
    return this.syncService.synchronize(
  req.user.id,
  dto,
);
  }
}