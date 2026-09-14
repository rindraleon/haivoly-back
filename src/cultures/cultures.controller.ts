import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';

import { CulturesService } from './cultures.service';
import { CreateCultureDto } from './dto/creation-culture.dto';
import { UpdateCultureDto } from './dto/modification-culture.dto';
import { PointsGPSCultureDto } from './dto/points-gps-culture.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('parcelles/:parcelleId/cultures')
@UseGuards(JwtAuthGuard)
export class CulturesController {
  constructor(
    private readonly culturesService: CulturesService,
  ) {}

  // =========================
  // CRÉER UNE CULTURE
  // =========================
  @Post()
  create(
    @Param('parcelleId') parcelleId: string,
    @Body() dto: CreateCultureDto,
    @Request() req: any,
  ) {
    return this.culturesService.create(
      parcelleId,
      dto,
      req.user.id,
    );
  }

  // =========================
  // RÉCUPÉRER LES CULTURES
  // D'UNE PARCELLE
  // =========================
  @Get()
  findAll(
    @Param('parcelleId') parcelleId: string,
    @Request() req: any,
  ) {
    return this.culturesService.findAll(
      parcelleId,
      req.user.id,
    );
  }

    // =========================
  // RÉCUPÉRER LES POINTS GPS D'UNE CULTURE
  // =========================

  @Get(':id/points-gps')
  findPointsGPS(
    @Param('parcelleId') parcelleId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.culturesService.findPointsGPS(
      parcelleId,
      id,
      req.user.id,
    );
  }

  // =========================
  // ENREGISTRER LES POINTS GPS D'UNE CULTURE
  // =========================

  @Post(':id/points-gps')
  savePointsGPS(
    @Param('parcelleId') parcelleId: string,
    @Param('id') id: string,
    @Body() dto: PointsGPSCultureDto,
    @Request() req: any,
  ) {
    return this.culturesService.savePointsGPS(
      parcelleId,
      id,
      req.user.id,
      dto.points,
    );
  }

  // =========================
  // RÉCUPÉRER UNE CULTURE
  // =========================
  @Get(':id')
  findOne(
    @Param('parcelleId') parcelleId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.culturesService.findOne(
      parcelleId,
      id,
      req.user.id,
    );
  }

  // =========================
  // MODIFIER UNE CULTURE
  // =========================
  @Patch(':id')
  update(
    @Param('parcelleId') parcelleId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCultureDto,
    @Request() req: any,
  ) {
    return this.culturesService.update(
      parcelleId,
      id,
      dto,
      req.user.id,
    );
  }

  // =========================
  // SUPPRESSION LOGIQUE
  // =========================
  @Delete(':id')
  remove(
    @Param('parcelleId') parcelleId: string,
    @Param('id') id: string,
    @Body() body: { raison?: string },
    @Request() req: any,
  ) {
    return this.culturesService.remove(
      parcelleId,
      id,
      req.user.id,
      body.raison,
    );
  }
}