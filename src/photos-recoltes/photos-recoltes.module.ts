import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { PhotosRecoltesController } from './photos-recoltes.controller';
import { PhotosRecoltesService } from './photos-recoltes.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    PhotosRecoltesController,
  ],

  providers: [
    PhotosRecoltesService,
  ],

  exports: [
    PhotosRecoltesService,
  ],
})
export class PhotosRecoltesModule {}