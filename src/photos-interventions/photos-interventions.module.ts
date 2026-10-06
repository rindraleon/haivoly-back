import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PhotosInterventionsController } from './photos-interventions.controller';
import { PhotosInterventionsService } from './photos-interventions.service';
import { PhotoIntervention } from './entities/photo-intervention.entity';
import { Intervention } from '../interventions/entities/intervention.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PhotoIntervention, Intervention])],
  controllers: [PhotosInterventionsController],
  providers: [PhotosInterventionsService],
  exports: [PhotosInterventionsService],
})
export class PhotosInterventionsModule {}
