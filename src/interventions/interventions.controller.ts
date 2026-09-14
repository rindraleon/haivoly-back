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

import { InterventionsService } from './interventions.service';

import { CreateInterventionDto } from './dto/creation-intervention.dto';
import { UpdateInterventionDto } from './dto/modification-intervention.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(
  'parcelles/:parcelleId/cultures/:cultureId/interventions',
)
@UseGuards(JwtAuthGuard)
export class InterventionsController {
  constructor(
    private readonly interventionsService: InterventionsService,
  ) {}

  // =========================
  // CRÉER
  // =========================
  @Post()
  create(
    @Param('cultureId') cultureId: string,
    @Body() dto: CreateInterventionDto,
    @Request() req: any,
  ) {
    return this.interventionsService.create(
      cultureId,
      dto,
      req.user.id,
    );
  }

  // =========================
  // LISTE
  // =========================
  @Get()
  findAll(
    @Param('cultureId') cultureId: string,
    @Request() req: any,
  ) {
    return this.interventionsService.findAll(
      cultureId,
      req.user.id,
    );
  }

  // =========================
  // UNE INTERVENTION
  // =========================
  @Get(':id')
  findOne(
    @Param('cultureId') cultureId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.interventionsService.findOne(
      cultureId,
      id,
      req.user.id,
    );
  }

  // =========================
  // MODIFIER
  // =========================
  @Patch(':id')
  update(
    @Param('cultureId') cultureId: string,
    @Param('id') id: string,
    @Body() dto: UpdateInterventionDto,
    @Request() req: any,
  ) {
    return this.interventionsService.update(
      cultureId,
      id,
      dto,
      req.user.id,
    );
  }

  // =========================
  // SUPPRIMER
  // =========================
  @Delete(':id')
  remove(
    @Param('cultureId') cultureId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.interventionsService.remove(
      cultureId,
      id,
      req.user.id,
    );
  }
}