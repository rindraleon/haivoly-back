import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreatePhotoRecolteDto } from './dto/creation-photo-recolte.dto';
import { UpdatePhotoRecolteDto } from './dto/modification-photo-recolte.dto';

@Injectable()
export class PhotosRecoltesService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // VÉRIFIER LA RÉCOLTE
  // =========================
  private async verifierRecolte(recolteId: string, utilisateurId: string) {
    const recolte = await this.prisma.recolte.findFirst({
      where: {
        id: recolteId,
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

    if (!recolte) {
      throw new NotFoundException('Récolte introuvable');
    }

    if (recolte.culture.statut === 'SUPPRIMEE') {
      throw new NotFoundException('Culture introuvable');
    }

    if (recolte.culture.statut !== 'RECOLTEE') {
      throw new BadRequestException(
        'La culture doit être récoltée pour gérer les photos de récolte',
      );
    }

    return recolte;
  }

  // =========================
  // AJOUTER UNE PHOTO
  // =========================
  async create(
    recolteId: string,
    dto: CreatePhotoRecolteDto,
    utilisateurId: string,
  ) {
    await this.verifierRecolte(recolteId, utilisateurId);

    return this.prisma.photoRecolte.create({
      data: {
        url: dto.url,
        recolteId,
      },
    });
  }

  // =========================
  // UPLOADER UNE PHOTO
  // =========================
  async upload(recolteId: string, utilisateurId: string, url: string) {
    await this.verifierRecolte(recolteId, utilisateurId);

    return this.prisma.photoRecolte.create({
      data: {
        url,
        recolteId,
      },
    });
  }

  // =========================
  // RÉCUPÉRER LES PHOTOS
  // =========================
  async findAll(recolteId: string, utilisateurId: string) {
    await this.verifierRecolte(recolteId, utilisateurId);

    return this.prisma.photoRecolte.findMany({
      where: {
        recolteId,
      },
      orderBy: {
        dateAjout: 'desc',
      },
    });
  }

  // =========================
  // RÉCUPÉRER UNE PHOTO
  // =========================
  async findOne(recolteId: string, id: string, utilisateurId: string) {
    await this.verifierRecolte(recolteId, utilisateurId);

    const photo = await this.prisma.photoRecolte.findFirst({
      where: {
        id,
        recolteId,
      },
    });

    if (!photo) {
      throw new NotFoundException('Photo de récolte introuvable');
    }

    return photo;
  }

  // =========================
  // MODIFIER UNE PHOTO
  // =========================
  async update(
    recolteId: string,
    id: string,
    dto: UpdatePhotoRecolteDto,
    utilisateurId: string,
  ) {
    await this.verifierRecolte(recolteId, utilisateurId);

    await this.findOne(recolteId, id, utilisateurId);

    return this.prisma.photoRecolte.update({
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
  async remove(recolteId: string, id: string, utilisateurId: string) {
    await this.verifierRecolte(recolteId, utilisateurId);

    await this.findOne(recolteId, id, utilisateurId);

    return this.prisma.photoRecolte.delete({
      where: {
        id,
      },
    });
  }
}
