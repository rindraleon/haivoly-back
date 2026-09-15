/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Request,
  UseGuards,
} from '@nestjs/common';

import { ParcellesService } from './parcelles.service';
import { CreateParcelleDto } from './dto/creation-parcelle.dto';
import { UpdateParcelleDto } from './dto/modification-parcelle.dto';
import { SupprimerParcelleDto } from './dto/supprimer-parcelle.dto';
import { AjouterPointsGPSDto } from './dto/ajouter-points-gps.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ModifierDelimitationDto } from './dto/modifier-delimitation.dto';

@Controller('parcelles')
@UseGuards(JwtAuthGuard)
export class ParcellesController {
  constructor(private readonly parcellesService: ParcellesService) {}

  @Post()
  create(@Body() dto: CreateParcelleDto, @Request() req: any) {
    return this.parcellesService.create(dto, req.user.id);
  }

  @Get()
  findAll(@Request() req: any) {
    return this.parcellesService.findAll(req.user.id);
  }

  @Post(':id/points-gps')
  addPointsGPS(
    @Param('id') id: string,
    @Body() dto: AjouterPointsGPSDto,
    @Request() req: any,
  ) {
    return this.parcellesService.addPointsGPS(id, dto.pointsGPS, req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: any) {
    return this.parcellesService.findOne(id, req.user.id);
  }

  @Put(':id/delimitation')
  updateDelimitation(
    @Param('id') id: string,
    @Body() dto: ModifierDelimitationDto,
    @Request() req: any,
  ) {
    return this.parcellesService.updateDelimitation(id, dto, req.user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateParcelleDto,
    @Request() req: any,
  ) {
    return this.parcellesService.update(id, dto, req.user.id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
    @Body() dto: SupprimerParcelleDto,
    @Request() req: any,
  ) {
    return this.parcellesService.remove(id, dto.raison, req.user.id);
  }
}
