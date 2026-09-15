/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
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

import { PhotosService } from './photos.service';

import { CreatePhotoDto } from './dto/creation-photo.dto';
import { UpdatePhotoDto } from './dto/modification-photo.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(
  'parcelles/:parcelleId/cultures/:cultureId/observations/:observationId/photos',
)
@UseGuards(JwtAuthGuard)
export class PhotosController {
  constructor(private readonly photosService: PhotosService) {}

  // =========================
  // AJOUTER UNE PHOTO
  // =========================
  @Post()
  create(
    @Param('cultureId') cultureId: string,
    @Param('observationId') observationId: string,
    @Body() createPhotoDto: CreatePhotoDto,
    @Request() req: any,
  ) {
    return this.photosService.create(
      observationId,
      cultureId,
      createPhotoDto,
      req.user.id,
    );
  }

  // =========================
  // RÉCUPÉRER LES PHOTOS
  // =========================
  @Get()
  findAll(
    @Param('cultureId') cultureId: string,
    @Param('observationId') observationId: string,
    @Request() req: any,
  ) {
    return this.photosService.findAll(observationId, cultureId, req.user.id);
  }

  // =========================
  // RÉCUPÉRER UNE PHOTO
  // =========================
  @Get(':id')
  findOne(
    @Param('cultureId') cultureId: string,
    @Param('observationId') observationId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.photosService.findOne(
      observationId,
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
    @Param('observationId') observationId: string,
    @Param('id') id: string,
    @Body() updatePhotoDto: UpdatePhotoDto,
    @Request() req: any,
  ) {
    return this.photosService.update(
      observationId,
      cultureId,
      id,
      updatePhotoDto,
      req.user.id,
    );
  }

  // =========================
  // SUPPRIMER UNE PHOTO
  // =========================
  @Delete(':id')
  remove(
    @Param('cultureId') cultureId: string,
    @Param('observationId') observationId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.photosService.remove(observationId, cultureId, id, req.user.id);
  }
}
