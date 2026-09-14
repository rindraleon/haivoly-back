import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { RecoltesController } from './recoltes.controller';
import { RecoltesService } from './recoltes.service';

@Module({
  imports: [PrismaModule],
  controllers: [RecoltesController],
  providers: [RecoltesService],
})
export class RecoltesModule {}