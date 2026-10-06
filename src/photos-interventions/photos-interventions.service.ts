import {
  BadRequestException,
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
  // NORMALISER L'URL PHOTO
  // =========================
  private normaliserUrlPhoto(url: string): string {
    const value = url?.trim();

    if (!value) {
      throw new BadRequestException(
        'L’URL de la photo est obligatoire',
      );
    }

    // URL complète
    if (/^https?:\/\//i.test(value)) {
      try {
        const parsed = new URL(value);

        // Toute URL locale de notre API devient un chemin relatif.
        if (
          parsed.pathname.startsWith(
            '/uploads/interventions/',
          )
        ) {
          const filename = parsed.pathname
            .replace(
              /^\/uploads\/interventions\//,
              '',
            )
            .trim();

          if (!filename) {
            throw new BadRequestException(
              'Le nom du fichier photo est manquant',
            );
          }

          return `/uploads/interventions/${filename}`;
        }

        // URL externe : on la conserve.
        return value;
      } catch (error) {
        if (error instanceof BadRequestException) {
          throw error;
        }

        throw new BadRequestException(
          'URL de photo invalide',
        );
      }
    }

    // Chemin local déjà correct.
    if (
      value.startsWith(
        '/uploads/interventions/',
      )
    ) {
      const filename = value
        .replace(
          /^\/uploads\/interventions\//,
          '',
        )
        .trim();

      if (!filename) {
        throw new BadRequestException(
          'Le nom du fichier photo est manquant',
        );
      }

      return `/uploads/interventions/${filename}`;
    }

    throw new BadRequestException(
      'La photo doit utiliser un chemin /uploads/interventions/... ou une URL externe valide',
    );
  }

  // =========================
  // VÉRIFIER L'INTERVENTION
  // =========================
  private async verifierIntervention(
    interventionId: string,
    cultureId: string,
    utilisateurId: string,
  ) {
    const intervention =
      await this.prisma.intervention.findFirst({
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
      throw new NotFoundException(
        'Intervention introuvable',
      );
    }

    if (
      intervention.culture.statut ===
      'SUPPRIMEE'
    ) {
      throw new NotFoundException(
        'Culture introuvable',
      );
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
    const intervention =
      await this.verifierIntervention(
        interventionId,
        cultureId,
        utilisateurId,
      );

    if (
      intervention.culture.statut === 'RECOLTEE' ||
      intervention.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible d’ajouter une photo à une intervention d’une culture terminée',
      );
    }

    const url = this.normaliserUrlPhoto(dto.url);

    return this.prisma.photoIntervention.create({
      data: {
        url,
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
    const intervention =
      await this.verifierIntervention(
        interventionId,
        cultureId,
        utilisateurId,
      );

    if (
      intervention.culture.statut === 'RECOLTEE' ||
      intervention.culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Impossible d’ajouter une photo à une intervention d’une culture terminée',
      );
    }

    const normalizedUrl =
      this.normaliserUrlPhoto(url);

    return this.prisma.photoIntervention.create({
      data: {
        url: normalizedUrl,
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
    await this.verifierIntervention(
      interventionId,
      cultureId,
      utilisateurId,
    );

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
    await this.verifierIntervention(
      interventionId,
      cultureId,
      utilisateurId,
    );

    const photo =
      await this.prisma.photoIntervention.findFirst({
        where: {
          id,
          interventionId,
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
    interventionId: string,
    cultureId: string,
    id: string,
    dto: UpdatePhotoInterventionDto,
    utilisateurId: string,
  ) {
    const intervention =
      await this.verifierIntervention(
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

    await this.findOne(
      interventionId,
      cultureId,
      id,
      utilisateurId,
    );

    const normalizedUrl =
      dto.url !== undefined
        ? this.normaliserUrlPhoto(dto.url)
        : undefined;

    return this.prisma.photoIntervention.update({
      where: {
        id,
      },
      data: {
        ...(normalizedUrl !== undefined && {
          url: normalizedUrl,
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
    const intervention =
      await this.verifierIntervention(
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

    await this.findOne(
      interventionId,
      cultureId,
      id,
      utilisateurId,
    );

    return this.prisma.photoIntervention.delete({
      where: {
        id,
      },
    });
  }
}