import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Parcelle } from '../parcelles/entities/parcelle.entity';
import { Culture } from '../cultures/entities/culture.entity';
import { Intervention } from '../interventions/entities/intervention.entity';
import { Observation } from '../observations/entities/observation.entity';
import { Photo } from '../photos/entities/photo.entity';
import { Recolte } from '../recoltes/entities/recolte.entity';
import { Recommendation } from '../recommendations/entities/recommendation.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Parcelle,
      Culture,
      Intervention,
      Observation,
      Photo,
      Recolte,
      Recommendation,
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
