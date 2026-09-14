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

import { PhotosInterventionsService } from './photos-interventions.service';

import { CreatePhotoInterventionDto } from './dto/creation-photo-intervention.dto';
import { UpdatePhotoInterventionDto } from './dto/modification-photo-intervention.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(
  'parcelles/:parcelleId/cultures/:cultureId/interventions/:interventionId/photos',
)
@UseGuards(JwtAuthGuard)
export class PhotosInterventionsController {
  constructor(
    private readonly photosInterventionsService: PhotosInterventionsService,
  ) {}

  // =========================
  // AJOUTER UNE PHOTO
  // =========================
  @Post()
  create(
    @Param('cultureId') cultureId: string,
    @Param('interventionId') interventionId: string,
    @Body()
    createPhotoInterventionDto: CreatePhotoInterventionDto,
    @Request() req: any,
  ) {
    return this.photosInterventionsService.create(
      interventionId,
      cultureId,
      createPhotoInterventionDto,
      req.user.id,
    );
  }

  // =========================
  // RÉCUPÉRER LES PHOTOS
  // =========================
  @Get()
  findAll(
    @Param('cultureId') cultureId: string,
    @Param('interventionId') interventionId: string,
    @Request() req: any,
  ) {
    return this.photosInterventionsService.findAll(
      interventionId,
      cultureId,
      req.user.id,
    );
  }

  // =========================
  // RÉCUPÉRER UNE PHOTO
  // =========================
  @Get(':id')
  findOne(
    @Param('cultureId') cultureId: string,
    @Param('interventionId') interventionId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.photosInterventionsService.findOne(
      interventionId,
      cultureId,
      id,
      req.user.id,
    );
  }

  // =========================
  // MODIFIER UNE PHOTO
  // =========================
  @Patch(':id')
  update(
    @Param('cultureId') cultureId: string,
    @Param('interventionId') interventionId: string,
    @Param('id') id: string,
    @Body()
    updatePhotoInterventionDto: UpdatePhotoInterventionDto,
    @Request() req: any,
  ) {
    return this.photosInterventionsService.update(
      interventionId,
      cultureId,
      id,
      updatePhotoInterventionDto,
      req.user.id,
    );
  }

  // =========================
  // SUPPRIMER UNE PHOTO
  // =========================
  @Delete(':id')
  remove(
    @Param('cultureId') cultureId: string,
    @Param('interventionId') interventionId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.photosInterventionsService.remove(
      interventionId,
      cultureId,
      id,
      req.user.id,
    );
  }
}