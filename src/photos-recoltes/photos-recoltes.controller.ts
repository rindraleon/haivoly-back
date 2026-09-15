/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PhotosRecoltesService } from './photos-recoltes.service';

import { CreatePhotoRecolteDto } from './dto/creation-photo-recolte.dto';

import { UpdatePhotoRecolteDto } from './dto/modification-photo-recolte.dto';

@Controller('recoltes/:recolteId/photos')
@UseGuards(JwtAuthGuard)
export class PhotosRecoltesController {
  constructor(private readonly photosRecoltesService: PhotosRecoltesService) {}

  // =========================
  // AJOUTER UNE PHOTO PAR URL
  // =========================

  @Post()
  async create(
    @Param('recolteId') recolteId: string,

    @Body()
    createPhotoRecolteDto: CreatePhotoRecolteDto,

    @Request() req: any,
  ) {
    return this.photosRecoltesService.create(
      recolteId,
      createPhotoRecolteDto,
      req.user.id,
    );
  }

  // =========================
  // UPLOADER UNE PHOTO
  // =========================

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/recoltes',

        filename: (_req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);

          const extension = extname(file.originalname).toLowerCase();

          callback(null, `recolte-${uniqueSuffix}${extension}`);
        },
      }),

      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (_req, file, callback) => {
        const extension = extname(file.originalname).toLowerCase();

        const extensionsAutorisees = ['.jpg', '.jpeg', '.png', '.webp'];

        if (!extensionsAutorisees.includes(extension)) {
          return callback(
            new BadRequestException(
              'Format d’image non autorisé. Formats acceptés : JPG, JPEG, PNG, WEBP',
            ),
            false,
          );
        }

        callback(null, true);
      },
    }),
  )
  async uploadPhoto(
    @Param('recolteId') recolteId: string,

    @UploadedFile()
    file: {
      filename: string;
      originalname: string;
      mimetype: string;
      size: number;
    },

    @Request() req: any,
  ) {
    if (!file) {
      throw new BadRequestException('Aucune image n’a été envoyée');
    }

    const url =
      //`http://192.168.1.116:3000/uploads/recoltes/`
      `http://192.168.0.43:3000/uploads/recoltes/` + file.filename;

    const photo = await this.photosRecoltesService.upload(
      recolteId,
      req.user.id,
      url,
    );

    return {
      message: 'Photo de récolte uploadée avec succès',
      photo,
    };
  }

  // =========================
  // RÉCUPÉRER TOUTES LES PHOTOS
  // =========================

  @Get()
  async findAll(
    @Param('recolteId') recolteId: string,

    @Request() req: any,
  ) {
    return this.photosRecoltesService.findAll(recolteId, req.user.id);
  }

  // =========================
  // RÉCUPÉRER UNE PHOTO
  // =========================

  @Get(':id')
  async findOne(
    @Param('recolteId') recolteId: string,

    @Param('id') id: string,

    @Request() req: any,
  ) {
    return this.photosRecoltesService.findOne(recolteId, id, req.user.id);
  }

  // =========================
  // MODIFIER UNE PHOTO
  // =========================

  @Patch(':id')
  async update(
    @Param('recolteId') recolteId: string,

    @Param('id') id: string,

    @Body()
    updatePhotoRecolteDto: UpdatePhotoRecolteDto,

    @Request() req: any,
  ) {
    return this.photosRecoltesService.update(
      recolteId,
      id,
      updatePhotoRecolteDto,
      req.user.id,
    );
  }

  // =========================
  // SUPPRIMER UNE PHOTO
  // =========================

  @Delete(':id')
  async remove(
    @Param('recolteId') recolteId: string,

    @Param('id') id: string,

    @Request() req: any,
  ) {
    return this.photosRecoltesService.remove(recolteId, id, req.user.id);
  }
}
