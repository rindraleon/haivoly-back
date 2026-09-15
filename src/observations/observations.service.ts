import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateObservationDto } from './dto/creation-observation.dto';
import { UpdateObservationDto } from './dto/modification-observation.dto';

@Injectable()
export class ObservationsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // VÉRIFIER LA CULTURE
  // =========================
  private async verifierCulture(
    parcelleId: string,
    cultureId: string,
    utilisateurId: string,
  ) {
    const culture = await this.prisma.culture.findFirst({
      where: {
        id: cultureId,
        parcelleId,
        parcelle: {
          utilisateurId,
        },
      },
    });

    if (!culture) {
      throw new NotFoundException('Culture introuvable');
    }

    if (culture.statut === 'SUPPRIMEE') {
      throw new NotFoundException('Cette culture est supprimée');
    }

    return culture;
  }

  // =========================
  // CRÉER UNE OBSERVATION
  // =========================
  async create(
    parcelleId: string,
    cultureId: string,
    dto: CreateObservationDto,
    utilisateurId: string,
  ) {
    const culture = await this.verifierCulture(
      parcelleId,
      cultureId,
      utilisateurId,
    );

    if (culture.statut === 'RECOLTEE' || culture.statut === 'ABANDONNEE') {
      throw new ForbiddenException(
        'Impossible de créer une observation pour cette culture',
      );
    }

    return this.prisma.observation.create({
      data: {
        description: dto.description,

        date: dto.date ? new Date(dto.date) : undefined,

        cultureId,
      },
    });
  }

  // =========================
  // RÉCUPÉRER LES OBSERVATIONS
  // =========================
  async findAll(parcelleId: string, cultureId: string, utilisateurId: string) {
    await this.verifierCulture(parcelleId, cultureId, utilisateurId);

    return this.prisma.observation.findMany({
      where: {
        cultureId,
      },
      orderBy: {
        date: 'desc',
      },
      include: {
        photos: true,
      },
    });
  }

  // =========================
  // RÉCUPÉRER UNE OBSERVATION
  // =========================
  async findOne(
    parcelleId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    await this.verifierCulture(parcelleId, cultureId, utilisateurId);

    const observation = await this.prisma.observation.findFirst({
      where: {
        id,
        cultureId,
      },
      include: {
        photos: true,
      },
    });

    if (!observation) {
      throw new NotFoundException('Observation introuvable');
    }

    return observation;
  }

  // =========================
  // MODIFIER UNE OBSERVATION
  // =========================
  async update(
    parcelleId: string,
    cultureId: string,
    id: string,
    dto: UpdateObservationDto,
    utilisateurId: string,
  ) {
    const culture = await this.verifierCulture(
      parcelleId,
      cultureId,
      utilisateurId,
    );

    if (culture.statut === 'RECOLTEE' || culture.statut === 'ABANDONNEE') {
      throw new ForbiddenException(
        'Impossible de modifier une observation pour cette culture',
      );
    }

    const observation = await this.prisma.observation.findFirst({
      where: {
        id,
        cultureId,
      },
    });

    if (!observation) {
      throw new NotFoundException('Observation introuvable');
    }

    return this.prisma.observation.update({
      where: {
        id,
      },
      data: {
        ...(dto.description !== undefined && {
          description: dto.description,
        }),

        ...(dto.date !== undefined && {
          date: new Date(dto.date),
        }),
      },
      include: {
        photos: true,
      },
    });
  }

  // =========================
  // SUPPRIMER UNE OBSERVATION
  // =========================
  async remove(
    parcelleId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    const culture = await this.verifierCulture(
      parcelleId,
      cultureId,
      utilisateurId,
    );

    if (culture.statut === 'RECOLTEE' || culture.statut === 'ABANDONNEE') {
      throw new ForbiddenException(
        'Impossible de supprimer une observation pour cette culture',
      );
    }

    const observation = await this.prisma.observation.findFirst({
      where: {
        id,
        cultureId,
      },
    });

    if (!observation) {
      throw new NotFoundException('Observation introuvable');
    }

    return this.prisma.observation.delete({
      where: {
        id,
      },
    });
  }
}
