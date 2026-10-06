/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  Param,
  Request,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';

import { diskStorage } from 'multer';

import { extname } from 'path';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { PhotosRecoltesService } from './photos-recoltes.service';

@Controller('recoltes/:recolteId/photos')
@UseGuards(JwtAuthGuard)
export class PhotosRecoltesUploadController {
  constructor(private readonly photosRecoltesService: PhotosRecoltesService) {}

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
    @Param('recolteId')
    recolteId: string,

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

const url = `/uploads/recoltes/${file.filename}`;

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
}
