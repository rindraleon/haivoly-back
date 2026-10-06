import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PhotosRecoltesController } from './photos-recoltes.controller';
import { PhotosRecoltesService } from './photos-recoltes.service';
import { PhotoRecolte } from './entities/photo-recolte.entity';
import { Recolte } from '../recoltes/entities/recolte.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PhotoRecolte, Recolte])],
  controllers: [PhotosRecoltesController],
  providers: [PhotosRecoltesService],
  exports: [PhotosRecoltesService],
})
export class PhotosRecoltesModule {}
