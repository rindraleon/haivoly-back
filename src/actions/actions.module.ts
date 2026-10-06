import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ActionsController } from './actions.controller';
import { ActionsService } from './actions.service';
import { Action } from './entities/action.entity';
import { Recommendation } from '../recommendations/entities/recommendation.entity';
import { Utilisateur } from '../users/entities/utilisateur.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Action, Recommendation, Utilisateur])],
  controllers: [ActionsController],
  providers: [ActionsService],
  exports: [ActionsService],
})
export class ActionsModule {}
