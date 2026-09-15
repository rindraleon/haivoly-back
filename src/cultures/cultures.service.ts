import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { StatutCulture } from '@prisma/client';

import { CreateCultureDto } from './dto/creation-culture.dto';
import { UpdateCultureDto } from './dto/modification-culture.dto';

@Injectable()
export class CulturesService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================
  // CRÉER UNE CULTURE
  // =========================
  async create(
    parcelleId: string,
    dto: CreateCultureDto,
    utilisateurId: string,
  ) {
    const parcelle = await this.prisma.parcelle.findFirst({
      where: {
        id: parcelleId,
        utilisateurId,
      },
    });

    if (!parcelle) {
      throw new NotFoundException('Parcelle introuvable');
    }

    // Une parcelle supprimée ne peut plus recevoir
    // de nouvelle culture
    if (parcelle.statut === 'SUPPRIMEE') {
      throw new BadRequestException(
        'Impossible d’ajouter une culture sur une parcelle supprimée',
      );
    }

    // Vérification des dates
    if (
      dto.datePlantation &&
      dto.datePrevueRecolte &&
      new Date(dto.datePrevueRecolte) < new Date(dto.datePlantation)
    ) {
      throw new BadRequestException(
        'La date prévue de récolte doit être après la date de plantation',
      );
    }

    return this.prisma.culture.create({
      data: {
        nom: dto.nom,
        type: dto.type,
        variete: dto.variete,

        datePlantation: dto.datePlantation
          ? new Date(dto.datePlantation)
          : undefined,

        datePrevueRecolte: dto.datePrevueRecolte
          ? new Date(dto.datePrevueRecolte)
          : undefined,

        description: dto.description,
        stade: dto.stade,

        // PLANIFIEE par défaut si aucun statut n'est fourni
        statut: dto.statut ?? StatutCulture.PLANIFIEE,

        parcelleId,
      },
    });
  }

  // =========================
  // RÉCUPÉRER LES CULTURES
  // =========================
  async findAll(parcelleId: string, utilisateurId: string) {
    const parcelle = await this.prisma.parcelle.findFirst({
      where: {
        id: parcelleId,
        utilisateurId,
      },
    });

    if (!parcelle) {
      throw new NotFoundException('Parcelle introuvable');
    }

    return this.prisma.culture.findMany({
      where: {
        parcelleId,
      },
      orderBy: {
        creeA: 'desc',
      },
    });
  }

  // =========================
  // RÉCUPÉRER UNE CULTURE
  // =========================
  async findOne(parcelleId: string, id: string, utilisateurId: string) {
    const culture = await this.prisma.culture.findFirst({
      where: {
        id,
        parcelleId,
        parcelle: {
          utilisateurId,
        },
      },
    });

    if (!culture) {
      throw new NotFoundException('Culture introuvable');
    }

    return culture;
  }

  // =========================
  // VÉRIFIER LA TRANSITION
  // DE STATUT
  // =========================
  private verifierTransitionStatut(
    actuel: StatutCulture,
    nouveau: StatutCulture,
  ) {
    if (actuel === nouveau) {
      throw new BadRequestException(`La culture est déjà au statut ${actuel}`);
    }

    const transitionsAutorisees: Record<StatutCulture, StatutCulture[]> = {
      // PLANIFIEE peut aller vers tous les autres statuts
      PLANIFIEE: [
        StatutCulture.EN_COURS,
        StatutCulture.ABANDONNEE,
        StatutCulture.SUPPRIMEE,
      ],

      // EN_COURS peut uniquement être récoltée
      EN_COURS: [StatutCulture.RECOLTEE],

      // Une culture récoltée ne peut plus changer
      RECOLTEE: [],

      // Une culture abandonnée peut être replanifiée
      // ou supprimée
      ABANDONNEE: [StatutCulture.PLANIFIEE, StatutCulture.SUPPRIMEE],

      // Une culture supprimée ne peut plus être modifiée
      SUPPRIMEE: [],
    };

    if (!transitionsAutorisees[actuel].includes(nouveau)) {
      throw new BadRequestException(
        `Transition de statut impossible : ${actuel} → ${nouveau}`,
      );
    }
  }

  // =========================
  // MODIFIER UNE CULTURE
  // =========================
  async update(
    parcelleId: string,
    id: string,
    dto: UpdateCultureDto,
    utilisateurId: string,
  ) {
    const culture = await this.prisma.culture.findFirst({
      where: {
        id,
        parcelleId,
        parcelle: {
          utilisateurId,
        },
      },
    });

    if (!culture) {
      throw new NotFoundException('Culture introuvable');
    }

    // Une culture récoltée ou supprimée ne peut plus être modifiée
    if (
      culture.statut === StatutCulture.RECOLTEE ||
      culture.statut === StatutCulture.SUPPRIMEE
    ) {
      throw new BadRequestException(
        'Impossible de modifier une culture récoltée ou supprimée',
      );
    }

    // Vérification du changement de statut
    if (dto.statut !== undefined) {
      this.verifierTransitionStatut(culture.statut, dto.statut);
    }

    // Calcul des dates finales
    const datePlantation =
      dto.datePlantation !== undefined
        ? new Date(dto.datePlantation)
        : culture.datePlantation;

    const datePrevueRecolte =
      dto.datePrevueRecolte !== undefined
        ? new Date(dto.datePrevueRecolte)
        : culture.datePrevueRecolte;

    // Vérification des dates
    if (
      datePlantation &&
      datePrevueRecolte &&
      datePrevueRecolte < datePlantation
    ) {
      throw new BadRequestException(
        'La date prévue de récolte doit être après la date de plantation',
      );
    }

    return this.prisma.culture.update({
      where: {
        id,
      },

      data: {
        ...(dto.nom !== undefined && {
          nom: dto.nom,
        }),

        ...(dto.type !== undefined && {
          type: dto.type,
        }),

        ...(dto.variete !== undefined && {
          variete: dto.variete,
        }),

        ...(dto.datePlantation !== undefined && {
          datePlantation: dto.datePlantation
            ? new Date(dto.datePlantation)
            : null,
        }),

        ...(dto.datePrevueRecolte !== undefined && {
          datePrevueRecolte: dto.datePrevueRecolte
            ? new Date(dto.datePrevueRecolte)
            : null,
        }),

        ...(dto.description !== undefined && {
          description: dto.description,
        }),

        ...(dto.stade !== undefined && {
          stade: dto.stade,
        }),

        ...(dto.statut !== undefined && {
          statut: dto.statut,
        }),
      },
    });
  }

  // =========================
  // SUPPRESSION LOGIQUE
  // =========================
  async remove(
    parcelleId: string,
    id: string,
    utilisateurId: string,
    raison?: string,
  ) {
    const culture = await this.prisma.culture.findFirst({
      where: {
        id,
        parcelleId,
        parcelle: {
          utilisateurId,
        },
      },
    });

    if (!culture) {
      throw new NotFoundException('Culture introuvable');
    }

    // Empêcher une deuxième suppression
    if (culture.statut === StatutCulture.SUPPRIMEE) {
      throw new BadRequestException('Cette culture est déjà supprimée');
    }

    return this.prisma.culture.update({
      where: {
        id,
      },

      data: {
        statut: StatutCulture.SUPPRIMEE,
        raisonSuppression: raison,
      },
    });
  }
  // =========================
  // RÉCUPÉRER LES POINTS GPS
  // D'UNE CULTURE
  // =========================
  async findPointsGPS(
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

    return this.prisma.pointGPSCulture.findMany({
      where: {
        cultureId,
      },
      orderBy: {
        ordre: 'asc',
      },
    });
  }

  // =========================
  // ENREGISTRER LES POINTS GPS
  // D'UNE CULTURE
  // =========================
  async savePointsGPS(
    parcelleId: string,
    cultureId: string,
    utilisateurId: string,
    points: {
      latitude: number;
      longitude: number;
      ordre: number;
    }[],
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

    // Une culture récoltée ou supprimée ne peut plus être tracée
    if (
      culture.statut === StatutCulture.RECOLTEE ||
      culture.statut === StatutCulture.SUPPRIMEE
    ) {
      throw new BadRequestException(
        'Impossible de modifier le tracé d’une culture récoltée ou supprimée',
      );
    }

    // Au minimum 3 points pour former une zone
    if (points.length < 3) {
      throw new BadRequestException(
        'Une culture doit avoir au moins 3 points GPS',
      );
    }

    // =====================================================
    // RÉCUPÉRER UNIQUEMENT LES CULTURES QUI OCCUPENT
    // ACTUELLEMENT UNE ZONE
    //
    // RECOLTEE   => disponible
    // ABANDONNEE => disponible
    // SUPPRIMEE  => disponible
    //
    // PLANIFIEE + EN_COURS => zone occupée
    // =====================================================

    const culturesActives = await this.prisma.culture.findMany({
      where: {
        parcelleId,

        // Ne prendre que les cultures qui occupent
        // actuellement une partie de la parcelle
        statut: {
          in: [StatutCulture.PLANIFIEE, StatutCulture.EN_COURS],
        },

        // Ne pas comparer la culture avec elle-même
        id: {
          not: cultureId,
        },
      },

      include: {
        pointsGPS: {
          orderBy: {
            ordre: 'asc',
          },
        },
      },
    });

    console.log('CULTURES ACTIVES:', culturesActives);

    // Vérifie si un point est à l'intérieur d'un polygone
    const pointDansPolygone = (
      latitude: number,
      longitude: number,
      polygone: {
        latitude: number;
        longitude: number;
      }[],
    ): boolean => {
      let dedans = false;

      for (let i = 0, j = polygone.length - 1; i < polygone.length; j = i++) {
        const xi = polygone[i].longitude;
        const yi = polygone[i].latitude;

        const xj = polygone[j].longitude;
        const yj = polygone[j].latitude;

        const intersecte =
          yi > latitude !== yj > latitude &&
          longitude < ((xj - xi) * (latitude - yi)) / (yj - yi) + xi;

        if (intersecte) {
          dedans = !dedans;
        }
      }

      return dedans;
    };

    // Vérifier si la nouvelle zone entre dans une zone active
    for (const cultureActive of culturesActives) {
      const zoneActive = cultureActive.pointsGPS;

      if (zoneActive.length < 3) {
        continue;
      }

      const chevauchement = points.some((point) =>
        pointDansPolygone(point.latitude, point.longitude, zoneActive),
      );

      if (chevauchement) {
        throw new BadRequestException(
          `La zone de la culture "${cultureActive.nom}" chevauche la zone d'une culture ${cultureActive.statut}.`,
        );
      }
    }
    // =====================================================
    // POUR L'INSTANT :
    // on prépare les zones actives.
    //
    // Les cultures RECOLTEE ne sont PAS récupérées ici,
    // donc leurs anciennes zones GPS ne bloquent plus
    // une nouvelle culture.
    // =====================================================

    // Supprimer l'ancien tracé
    await this.prisma.pointGPSCulture.deleteMany({
      where: {
        cultureId,
      },
    });

    // Enregistrer le nouveau tracé
    await this.prisma.pointGPSCulture.createMany({
      data: points.map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        ordre: point.ordre,
        cultureId,
      })),
    });

    return this.prisma.pointGPSCulture.findMany({
      where: {
        cultureId,
      },
      orderBy: {
        ordre: 'asc',
      },
    });
  }
}
