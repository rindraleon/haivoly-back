import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ObservationsService } from './observations.service';
import { CreateObservationDto } from './dto/creation-observation.dto';
import { UpdateObservationDto } from './dto/modification-observation.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller(
  'parcelles/:parcelleId/cultures/:cultureId/observations',
)
@UseGuards(JwtAuthGuard)
export class ObservationsController {
  constructor(
    private readonly observationsService: ObservationsService,
  ) {}

  @Post()
  create(
    @Param('parcelleId') parcelleId: string,
    @Param('cultureId') cultureId: string,
    @Body() dto: CreateObservationDto,
    @Request() req: any,
  ) {
    return this.observationsService.create(
      parcelleId,
      cultureId,
      dto,
      req.user.id,
    );
  }

  @Get()
  findAll(
    @Param('parcelleId') parcelleId: string,
    @Param('cultureId') cultureId: string,
    @Request() req: any,
  ) {
    return this.observationsService.findAll(
      parcelleId,
      cultureId,
      req.user.id,
    );
  }

  @Get(':id')
  findOne(
    @Param('parcelleId') parcelleId: string,
    @Param('cultureId') cultureId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.observationsService.findOne(
      parcelleId,
      cultureId,
      id,
      req.user.id,
    );
  }

  @Patch(':id')
  update(
    @Param('parcelleId') parcelleId: string,
    @Param('cultureId') cultureId: string,
    @Param('id') id: string,
    @Body() dto: UpdateObservationDto,
    @Request() req: any,
  ) {
    return this.observationsService.update(
      parcelleId,
      cultureId,
      id,
      dto,
      req.user.id,
    );
  }

  @Delete(':id')
  remove(
    @Param('parcelleId') parcelleId: string,
    @Param('cultureId') cultureId: string,
    @Param('id') id: string,
    @Request() req: any,
  ) {
    return this.observationsService.remove(
      parcelleId,
      cultureId,
      id,
      req.user.id,
    );
  }
}