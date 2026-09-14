import { Module } from '@nestjs/common';

import { PhotosInterventionsController } from './photos-interventions.controller';
import { PhotosInterventionsUploadController } from './photos-interventions-upload.controller';
import { PhotosInterventionsService } from './photos-interventions.service';

import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [
    PhotosInterventionsController,
    PhotosInterventionsUploadController,
  ],

  providers: [
    PhotosInterventionsService,
    PrismaService,
  ],

  exports: [
    PhotosInterventionsService,
  ],
})
export class PhotosInterventionsModule {}