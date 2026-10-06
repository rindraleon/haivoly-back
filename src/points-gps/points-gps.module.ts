import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { PointGPS } from './entities/point-gps.entity';
import { PointsGpsService } from './points-gps.service';

@Module({
  imports: [TypeOrmModule.forFeature([PointGPS])],
  providers: [PointsGpsService],
  exports: [PointsGpsService, TypeOrmModule],
})
export class PointsGpsModule {}
