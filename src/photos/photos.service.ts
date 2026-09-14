import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePhotoDto } from './dto/creation-photo.dto';
import { UpdatePhotoDto } from './dto/modification-photo.dto';

@Injectable()
export class PhotosService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // VÉRIFIER L'OBSERVATION
  // =========================
  private async verifierObservation(
    observationId: string,
    cultureId: string,
    utilisateurId: string,
  ) {
    const observation =
      await this.prisma.observation.findFirst({
        where: {
          id: observationId,
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

    if (!observation) {
      throw new NotFoundException(
        'Observation introuvable',
      );
    }

    if (
      observation.culture.statut === 'SUPPRIMEE'
    ) {
      throw new NotFoundException(
        'Culture introuvable',
      );
    }

    return observation;
  }

  // =========================
  // AJOUTER UNE PHOTO
  // =========================
  async create(
    observationId: string,
    cultureId: string,
    dto: CreatePhotoDto,
    utilisateurId: string,
  ) {
    const observation =
      await this.verifierObservation(
        observationId,
        cultureId,
        utilisateurId,
      );

    if (
      observation.culture.statut === 'RECOLTEE' ||
      observation.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible d’ajouter une photo à une observation d’une culture terminée',
      );
    }

    return this.prisma.photo.create({
      data: {
        url: dto.url,
        observationId,
      },
    });
  }

  // =========================
  // UPLOADER UNE PHOTO
  // =========================
  async upload(
    observationId: string,
    cultureId: string,
    utilisateurId: string,
    url: string,
  ) {
    const observation =
      await this.verifierObservation(
        observationId,
        cultureId,
        utilisateurId,
      );

    if (
      observation.culture.statut === 'RECOLTEE' ||
      observation.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible d’ajouter une photo à une observation d’une culture terminée',
      );
    }

    return this.prisma.photo.create({
      data: {
        url,
        observationId,
      },
    });
  }

  // =========================
  // RÉCUPÉRER LES PHOTOS
  // =========================
  async findAll(
    observationId: string,
    cultureId: string,
    utilisateurId: string,
  ) {
    await this.verifierObservation(
      observationId,
      cultureId,
      utilisateurId,
    );

    return this.prisma.photo.findMany({
      where: {
        observationId,
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
    observationId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    await this.verifierObservation(
      observationId,
      cultureId,
      utilisateurId,
    );

    const photo =
      await this.prisma.photo.findFirst({
        where: {
          id,
          observationId,
        },
      });

    if (!photo) {
      throw new NotFoundException(
        'Photo introuvable',
      );
    }

    return photo;
  }

  // =========================
  // MODIFIER UNE PHOTO
  // =========================
  async update(
    observationId: string,
    cultureId: string,
    id: string,
    dto: UpdatePhotoDto,
    utilisateurId: string,
  ) {
    const observation =
      await this.verifierObservation(
        observationId,
        cultureId,
        utilisateurId,
      );

    if (
      observation.culture.statut === 'RECOLTEE' ||
      observation.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible de modifier une photo d’une observation d’une culture terminée',
      );
    }

    await this.findOne(
      observationId,
      cultureId,
      id,
      utilisateurId,
    );

    return this.prisma.photo.update({
      where: {
        id,
      },
      data: {
        ...(dto.url !== undefined && {
          url: dto.url,
        }),
      },
    });
  }

  // =========================
  // SUPPRIMER UNE PHOTO
  // =========================
  async remove(
    observationId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    const observation =
      await this.verifierObservation(
        observationId,
        cultureId,
        utilisateurId,
      );

    if (
      observation.culture.statut === 'RECOLTEE' ||
      observation.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible de supprimer une photo d’une observation d’une culture terminée',
      );
    }

    await this.findOne(
      observationId,
      cultureId,
      id,
      utilisateurId,
    );

    return this.prisma.photo.delete({
      where: {
        id,
      },
    });
  }
}