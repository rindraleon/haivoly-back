import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { RecoltesController } from './recoltes.controller';
import { RecoltesService } from './recoltes.service';
import { Recolte } from './entities/recolte.entity';
import { PhotoRecolte } from '../photos-recoltes/entities/photo-recolte.entity';
import { Culture } from '../cultures/entities/culture.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Recolte, PhotoRecolte, Culture])],
  controllers: [RecoltesController],
  providers: [RecoltesService],
  exports: [RecoltesService],
})
export class RecoltesModule {}
