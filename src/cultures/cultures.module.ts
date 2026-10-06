import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CulturesController } from './cultures.controller';
import { CulturesService } from './cultures.service';
import { Culture } from './entities/culture.entity';
import { PointGPSCulture } from './entities/point-gps-culture.entity';
import { Recolte } from '../recoltes/entities/recolte.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Culture, PointGPSCulture, Recolte])],
  controllers: [CulturesController],
  providers: [CulturesService],
  exports: [CulturesService],
})
export class CulturesModule {}
