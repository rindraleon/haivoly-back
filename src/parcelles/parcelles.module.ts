import { Module } from '@nestjs/common';

import { ParcellesController } from './parcelles.controller';
import { ParcellesService } from './parcelles.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ParcellesController],
  providers: [ParcellesService],
})
export class ParcellesModule {}
