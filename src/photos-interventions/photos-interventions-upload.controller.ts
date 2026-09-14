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
import { PhotosInterventionsService } from './photos-interventions.service';

@Controller(
  'parcelles/:parcelleId/cultures/:cultureId/interventions/:interventionId/photos',
)
@UseGuards(JwtAuthGuard)
export class PhotosInterventionsUploadController {
  constructor(
    private readonly photosInterventionsService: PhotosInterventionsService,
  ) {}

  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/interventions',

        filename: (_req, file, callback) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);

          const extension = extname(
            file.originalname,
          ).toLowerCase();

          callback(
            null,
            `intervention-${uniqueSuffix}${extension}`,
          );
        },
      }),

      limits: {
        fileSize: 5 * 1024 * 1024,
      },

      fileFilter: (_req, file, callback) => {
        const extension = extname(
          file.originalname,
        ).toLowerCase();

        const extensionsAutorisees = [
          '.jpg',
          '.jpeg',
          '.png',
          '.webp',
        ];

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
    @Param('cultureId') cultureId: string,
    @Param('interventionId') interventionId: string,
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
      throw new BadRequestException(
        'Aucune image n’a été envoyée',
      );
    }

    const url =
    `http://192.168.0.106:3000/uploads/interventions/`
    //`http://192.168.1.43:3000/uploads/interventions/` +
      file.filename;

    const photo =
      await this.photosInterventionsService.upload(
        interventionId,
        cultureId,
        req.user.id,
        url,
      );

    return {
      message: 'Photo uploadée avec succès',
      photo,
    };
  }
}