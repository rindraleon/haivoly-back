import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { RecoltesService } from './recoltes.service';
import { CreateRecolteDto } from './dto/creation-recolte.dto';
import { UpdateRecolteDto } from './dto/modification-recolte.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller()
@UseGuards(JwtAuthGuard)
export class RecoltesController {
  constructor(
    private readonly recoltesService: RecoltesService,
  ) {}

  // =========================
  // LISTE DE TOUTES LES RÉCOLTES
  // =========================

  @Get('recoltes')
  async findAll(@Request() req: any) {
    return this.recoltesService.findAll(req.user.id);
  }

  // =========================
  // CRÉER UNE RÉCOLTE
  // =========================

  @Post('cultures/:cultureId/recolte')
  async create(
    @Param('cultureId') cultureId: string,
    @Body() dto: CreateRecolteDto,
    @Request() req: any,
  ) {
    return this.recoltesService.create(
      cultureId,
      dto,
      req.user.id,
    );
  }

  // =========================
  // RÉCUPÉRER LA RÉCOLTE D'UNE CULTURE
  // =========================

  @Get('cultures/:cultureId/recolte')
  async findOne(
    @Param('cultureId') cultureId: string,
    @Request() req: any,
  ) {
    return this.recoltesService.findOne(
      cultureId,
      req.user.id,
    );
  }

  // =========================
  // MODIFIER UNE RÉCOLTE
  // =========================

  @Patch('recoltes/:id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRecolteDto,
    @Request() req: any,
  ) {
    return this.recoltesService.update(
      id,
      dto,
      req.user.id,
    );
  }

  // =========================
  // SUPPRIMER UNE RÉCOLTE
  // =========================

  @Delete('recoltes/:id')
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.recoltesService.remove(
      id,
      req.user.id,
    );
  }
}