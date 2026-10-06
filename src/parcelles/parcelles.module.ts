import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ParcellesController } from './parcelles.controller';
import { ParcellesService } from './parcelles.service';
import { Parcelle } from './entities/parcelle.entity';
import { PointGPS } from '../points-gps/entities/point-gps.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Parcelle, PointGPS])],
  controllers: [ParcellesController],
  providers: [ParcellesService],
  exports: [ParcellesService, TypeOrmModule],
})
export class ParcellesModule {}
