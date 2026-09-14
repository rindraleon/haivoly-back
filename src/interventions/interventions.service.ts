import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateInterventionDto } from './dto/creation-intervention.dto';
import { UpdateInterventionDto } from './dto/modification-intervention.dto';

@Injectable()
export class InterventionsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // =========================
  // CRÉER UNE INTERVENTION
  // =========================
  async create(
    cultureId: string,
    dto: CreateInterventionDto,
    utilisateurId: string,
  ) {
    // Vérifier que la culture appartient
    // à une parcelle de l'utilisateur connecté
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

    // Une culture récoltée ou abandonnée
    // ne peut plus recevoir d'intervention
    if (
      culture.statut === 'RECOLTEE' ||
      culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Cette culture est terminée et ne peut plus recevoir d’intervention',
      );
    }

    // Une culture supprimée n'est plus accessible
    if (culture.statut === 'SUPPRIMEE') {
      throw new NotFoundException(
        'Culture introuvable',
      );
    }

    return this.prisma.intervention.create({
      data: {
        type: dto.type,
        description: dto.description,

        date: dto.date
          ? new Date(dto.date)
          : undefined,

        produit: dto.produit,
        quantite: dto.quantite,
        unite: dto.unite,
        cout: dto.cout,

        cultureId,
      },
    });
  }

  // =========================
  // RÉCUPÉRER LES INTERVENTIONS
  // =========================
  async findAll(
    cultureId: string,
    utilisateurId: string,
  ) {
    // Vérifier que la culture appartient
    // à l'utilisateur connecté
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
    if (culture.statut === 'SUPPRIMEE') {
      throw new NotFoundException(
        'Culture introuvable',
      );
    }

    // RECOLTEE et ABANDONNEE restent consultables
    return this.prisma.intervention.findMany({
      where: {
        cultureId,
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  // =========================
  // RÉCUPÉRER UNE INTERVENTION
  // =========================
  async findOne(
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    const intervention =
      await this.prisma.intervention.findFirst({
        where: {
          id,
          cultureId,
          culture: {
            parcelle: {
              utilisateurId,
            },
          },
        },
      });

    if (!intervention) {
      throw new NotFoundException(
        'Intervention introuvable',
      );
    }

    // Une culture supprimée ne doit pas être consultable
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

    if (culture.statut === 'SUPPRIMEE') {
      throw new NotFoundException(
        'Culture introuvable',
      );
    }

    // RECOLTEE et ABANDONNEE restent consultables
    return intervention;
  }

  // =========================
  // MODIFIER UNE INTERVENTION
  // =========================
  async update(
    cultureId: string,
    id: string,
    dto: UpdateInterventionDto,
    utilisateurId: string,
  ) {
    const intervention =
      await this.prisma.intervention.findFirst({
        where: {
          id,
          cultureId,
          culture: {
            parcelle: {
              utilisateurId,
            },
          },
        },
      });

    if (!intervention) {
      throw new NotFoundException(
        'Intervention introuvable',
      );
    }

    // Récupérer la culture pour vérifier son statut
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

    // Une culture récoltée ou abandonnée
    // ne peut plus être modifiée
    if (
      culture.statut === 'RECOLTEE' ||
      culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Cette culture est terminée et ses interventions ne peuvent plus être modifiées',
      );
    }

    // Une culture supprimée n'est plus accessible
    if (culture.statut === 'SUPPRIMEE') {
      throw new NotFoundException(
        'Culture introuvable',
      );
    }

    return this.prisma.intervention.update({
      where: {
        id,
      },
      data: {
        ...(dto.type !== undefined && {
          type: dto.type,
        }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),

        ...(dto.date !== undefined && {
          date: new Date(dto.date),
        }),

        ...(dto.produit !== undefined && {
          produit: dto.produit,
        }),

        ...(dto.quantite !== undefined && {
          quantite: dto.quantite,
        }),

        ...(dto.unite !== undefined && {
          unite: dto.unite,
        }),

        ...(dto.cout !== undefined && {
          cout: dto.cout,
        }),
      },
    });
  }

  // =========================
  // SUPPRIMER UNE INTERVENTION
  // =========================
  async remove(
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    const intervention =
      await this.prisma.intervention.findFirst({
        where: {
          id,
          cultureId,
          culture: {
            parcelle: {
              utilisateurId,
            },
          },
        },
      });

    if (!intervention) {
      throw new NotFoundException(
        'Intervention introuvable',
      );
    }

    // Récupérer la culture pour vérifier son statut
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

    // Une culture récoltée ou abandonnée
    // ne peut plus supprimer ses interventions
    if (
      culture.statut === 'RECOLTEE' ||
      culture.statut === 'ABANDONNEE'
    ) {
      throw new ForbiddenException(
        'Cette culture est terminée et ses interventions ne peuvent plus être supprimées',
      );
    }

    // Une culture supprimée n'est plus accessible
    if (culture.statut === 'SUPPRIMEE') {
      throw new NotFoundException(
        'Culture introuvable',
      );
    }

    return this.prisma.intervention.delete({
      where: {
        id,
      },
    });
  }
}