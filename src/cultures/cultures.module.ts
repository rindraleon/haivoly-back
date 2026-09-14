import { Module } from '@nestjs/common';

import { CulturesController } from './cultures.controller';
import { CulturesService } from './cultures.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    CulturesController,
  ],

  providers: [
    CulturesService,
  ],
})
export class CulturesModule {}