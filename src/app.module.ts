import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ParcellesModule } from './parcelles/parcelles.module';
import { CulturesModule } from './cultures/cultures.module';
import { InterventionsModule } from './interventions/interventions.module';
import { ObservationsModule } from './observations/observations.module';
import { PhotosModule } from './photos/photos.module';
import { PhotosInterventionsModule} from './photos-interventions/photos-interventions.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { SyncModule } from './sync/sync.module';
import { RecoltesModule } from './recoltes/recoltes.module';
import { PhotosRecoltesModule } from './photos-recoltes/photos-recoltes.module';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '7d',
      },
    }),

    PrismaModule,
    AuthModule,
    ParcellesModule,
    CulturesModule,
    InterventionsModule,
    ObservationsModule,
    PhotosModule,
    PhotosInterventionsModule,
    DashboardModule,
    SyncModule,
    RecoltesModule,
    PhotosRecoltesModule,
  ],
})
export class AppModule {}