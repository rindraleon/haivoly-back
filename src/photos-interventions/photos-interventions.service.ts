import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePhotoInterventionDto } from './dto/creation-photo-intervention.dto';
import { UpdatePhotoInterventionDto } from './dto/modification-photo-intervention.dto';

@Injectable()
export class PhotosInterventionsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // VÉRIFIER L'INTERVENTION
  // =========================
  private async verifierIntervention(
    interventionId: string,
    cultureId: string,
    utilisateurId: string,
  ) {
    const intervention = await this.prisma.intervention.findFirst({
      where: {
        id: interventionId,
        cultureId,
        culture: {
          parcelle: {
            utilisateurId,
          },
        },
      },
      include: {
        culture: true,
      },
    });

    if (!intervention) {
      throw new NotFoundException('Intervention introuvable');
    }

    if (intervention.culture.statut === 'SUPPRIMEE') {
      throw new NotFoundException('Culture introuvable');
    }

    return intervention;
  }

  // =========================
  // AJOUTER UNE PHOTO
  // =========================
  async create(
    interventionId: string,
    cultureId: string,
    dto: CreatePhotoInterventionDto,
    utilisateurId: string,
  ) {
    const intervention = await this.verifierIntervention(
      interventionId,
      cultureId,
      utilisateurId,
    );

    // RECOLTEE et ABANDONNEE :
    // consultation uniquement
    if (
      intervention.culture.statut === 'RECOLTEE' ||
      intervention.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible d’ajouter une photo à une intervention d’une culture terminée',
      );
    }

    return this.prisma.photoIntervention.create({
      data: {
        url: dto.url,
        description: dto.description,
        interventionId,
      },
    });
  }

  // =========================
  // UPLOADER UNE PHOTO
  // =========================
  async upload(
    interventionId: string,
    cultureId: string,
    utilisateurId: string,
    url: string,
  ) {
    const intervention = await this.verifierIntervention(
      interventionId,
      cultureId,
      utilisateurId,
    );

    // RECOLTEE et ABANDONNEE :
    // consultation uniquement
    if (
      intervention.culture.statut === 'RECOLTEE' ||
      intervention.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible d’ajouter une photo à une intervention d’une culture terminée',
      );
    }

    return this.prisma.photoIntervention.create({
      data: {
        url,
        interventionId,
      },
    });
  }

  // =========================
  // RÉCUPÉRER LES PHOTOS
  // =========================
  async findAll(
    interventionId: string,
    cultureId: string,
    utilisateurId: string,
  ) {
    await this.verifierIntervention(interventionId, cultureId, utilisateurId);

    return this.prisma.photoIntervention.findMany({
      where: {
        interventionId,
      },
      orderBy: {
        dateAjout: 'desc',
      },
    });
  }

  // =========================
  // RÉCUPÉRER UNE PHOTO
  // =========================
  async findOne(
    interventionId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    await this.verifierIntervention(interventionId, cultureId, utilisateurId);

    const photo = await this.prisma.photoIntervention.findFirst({
      where: {
        id,
        interventionId,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo introuvable');
    }

    return photo;
  }

  // =========================
  // MODIFIER UNE PHOTO
  // =========================
  async update(
    interventionId: string,
    cultureId: string,
    id: string,
    dto: UpdatePhotoInterventionDto,
    utilisateurId: string,
  ) {
    const intervention = await this.verifierIntervention(
      interventionId,
      cultureId,
      utilisateurId,
    );

    if (
      intervention.culture.statut === 'RECOLTEE' ||
      intervention.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible de modifier une photo d’une intervention d’une culture terminée',
      );
    }

    await this.findOne(interventionId, cultureId, id, utilisateurId);

    return this.prisma.photoIntervention.update({
      where: {
        id,
      },
      data: {
        ...(dto.url !== undefined && {
          url: dto.url,
        }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),
      },
    });
  }

  // =========================
  // SUPPRIMER UNE PHOTO
  // =========================
  async remove(
    interventionId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    const intervention = await this.verifierIntervention(
      interventionId,
      cultureId,
      utilisateurId,
    );

    if (
      intervention.culture.statut === 'RECOLTEE' ||
      intervention.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible de supprimer une photo d’une intervention d’une culture terminée',
      );
    }

    await this.findOne(interventionId, cultureId, id, utilisateurId);

    return this.prisma.photoIntervention.delete({
      where: {
        id,
      },
    });
  }
}
