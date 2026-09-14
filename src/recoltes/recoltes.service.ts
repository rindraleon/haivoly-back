import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { StatutCulture } from '@prisma/client';

import { CreateRecolteDto } from './dto/creation-recolte.dto';
import { UpdateRecolteDto } from './dto/modification-recolte.dto';

@Injectable()
export class RecoltesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CRÉER UNE RÉCOLTE
  // =========================
  async create(
    cultureId: string,
    dto: CreateRecolteDto,
    utilisateurId: string,
  ) {
    // Vérifier que la culture appartient à l'utilisateur
    const culture = await this.prisma.culture.findFirst({
      where: {
        id: cultureId,
        parcelle: {
          utilisateurId,
        },
      },
    });

    if (!culture) {
      throw new NotFoundException(
        'Culture introuvable',
      );
    }

    // Seule une culture EN_COURS peut être récoltée
    if (culture.statut !== StatutCulture.EN_COURS) {
      throw new BadRequestException(
        'Seule une culture en cours peut être récoltée',
      );
    }

    // Une seule récolte par culture
    const recolteExistante =
      await this.prisma.recolte.findUnique({
        where: {
          cultureId,
        },
      });

    if (recolteExistante) {
      throw new BadRequestException(
        'Cette culture possède déjà une récolte',
      );
    }

    // Vérifier la date de récolte
    const dateRecolte = new Date(dto.dateRecolte);

    if (isNaN(dateRecolte.getTime())) {
      throw new BadRequestException(
        'Date de récolte invalide',
      );
    }

    if (
      culture.datePlantation &&
      dateRecolte < culture.datePlantation
    ) {
      throw new BadRequestException(
        'La date de récolte ne peut pas être avant la date de plantation',
      );
    }

    // Création de la récolte + changement de statut
    return this.prisma.$transaction(async (tx) => {
      const recolte = await tx.recolte.create({
        data: {
          dateRecolte,
          quantite: dto.quantite,
          unite: dto.unite,
          description: dto.description,
          prixVente: dto.prixVente,
          coutRecolte: dto.coutRecolte,
          cultureId,
        },
      });

      await tx.culture.update({
        where: {
          id: cultureId,
        },
        data: {
          statut: StatutCulture.RECOLTEE,
        },
      });

      return recolte;
    });
  }

  // =========================
  // RÉCUPÉRER LA RÉCOLTE
  // =========================
  async findOne(
    cultureId: string,
    utilisateurId: string,
  ) {
    const culture = await this.prisma.culture.findFirst({
      where: {
        id: cultureId,
        parcelle: {
          utilisateurId,
        },
      },
    });

    if (!culture) {
      throw new NotFoundException(
        'Culture introuvable',
      );
    }

    // Une culture supprimée ne doit pas être consultable
    if (culture.statut === StatutCulture.SUPPRIMEE) {
      throw new NotFoundException(
        'Culture introuvable',
      );
    }

    const recolte =
      await this.prisma.recolte.findUnique({
        where: {
          cultureId,
        },
        include: {
          photos: {
            orderBy: {
              dateAjout: 'desc',
            },
          },
        },
      });

    if (!recolte) {
      throw new NotFoundException(
        'Aucune récolte enregistrée pour cette culture',
      );
    }

    return recolte;
  }

  // =========================
  // MODIFIER UNE RÉCOLTE
  // =========================
  async update(
    id: string,
    dto: UpdateRecolteDto,
    utilisateurId: string,
  ) {
    const recolte =
      await this.prisma.recolte.findFirst({
        where: {
          id,
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
      throw new NotFoundException(
        'Récolte introuvable',
      );
    }

    // Une récolte appartenant à une culture récoltée
    // ne peut plus être modifiée
    throw new BadRequestException(
      'Une récolte appartenant à une culture récoltée ne peut plus être modifiée',
    );
  }

  // =========================
  // SUPPRIMER UNE RÉCOLTE
  // =========================
  async remove(
    id: string,
    utilisateurId: string,
  ) {
    const recolte =
      await this.prisma.recolte.findFirst({
        where: {
          id,
          culture: {
            parcelle: {
              utilisateurId,
            },
          },
        },
      });

    if (!recolte) {
      throw new NotFoundException(
        'Récolte introuvable',
      );
    }

    // La récolte fait partie de l'historique de la culture
    throw new BadRequestException(
      'Impossible de supprimer une récolte d’une culture récoltée',
    );
  }

  // =========================
  // AJOUTER UNE PHOTO
  // =========================
  async uploadPhoto(
    recolteId: string,
    utilisateurId: string,
    url: string,
  ) {
    const recolte =
      await this.prisma.recolte.findFirst({
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
      throw new NotFoundException(
        'Récolte introuvable',
      );
    }

    if (
      recolte.culture.statut !==
      StatutCulture.RECOLTEE
    ) {
      throw new BadRequestException(
        'La culture doit être récoltée pour ajouter une photo',
      );
    }

    // Une récolte peut posséder plusieurs photos
    return this.prisma.photoRecolte.create({
      data: {
        url,
        recolteId,
      },
    });
  }

  async findAll(utilisateurId: string) {
  return this.prisma.recolte.findMany({
    where: {
      culture: {
        parcelle: {
          utilisateurId,
        },
      },
    },
    include: {
      culture: {
        include: {
          parcelle: true,
        },
      },
      photos: {
        orderBy: {
          dateAjout: 'desc',
        },
      },
    },
    orderBy: {
      dateRecolte: 'desc',
    },
  });
}
}