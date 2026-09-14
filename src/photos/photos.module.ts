import { Module } from '@nestjs/common';

import { PhotosController } from './photos.controller';
import { PhotosUploadController } from './photos-upload.controller';
import { PhotosService } from './photos.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [
    PhotosController,
    PhotosUploadController,
  ],
  providers: [PhotosService],
})
export class PhotosModule {}