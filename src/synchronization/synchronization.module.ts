import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  ActionsSyncAliasController,
  SynchronizationController,
} from './synchronization.controller';
import { SynchronizationService } from './synchronization.service';
import { Action } from '../actions/entities/action.entity';
import { ActionsModule } from '../actions/actions.module';
import { ParcellesModule } from '../parcelles/parcelles.module';
import { CulturesModule } from '../cultures/cultures.module';
import { InterventionsModule } from '../interventions/interventions.module';
import { ObservationsModule } from '../observations/observations.module';
import { RecoltesModule } from '../recoltes/recoltes.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Action]),
    ActionsModule,
    ParcellesModule,
    CulturesModule,
    InterventionsModule,
    ObservationsModule,
    RecoltesModule,
  ],
  controllers: [SynchronizationController, ActionsSyncAliasController],
  providers: [SynchronizationService],
  exports: [SynchronizationService],
})
export class SynchronizationModule {}
