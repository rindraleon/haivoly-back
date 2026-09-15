import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateParcelleDto } from './dto/creation-parcelle.dto';
import { UpdateParcelleDto } from './dto/modification-parcelle.dto';
import { ModifierDelimitationDto } from './dto/modifier-delimitation.dto';

@Injectable()
export class ParcellesService {
  constructor(private readonly prisma: PrismaService) {}

  // Créer une parcelle
  async create(dto: CreateParcelleDto, utilisateurId: string) {
    return this.prisma.parcelle.create({
      data: {
        nom: dto.nom,
        description: dto.description,
        superficie: dto.superficie,
        typeSol: dto.typeSol,
        latitude: dto.latitude,
        longitude: dto.longitude,

        utilisateurId,
      },
    });
  }

  // Récupérer uniquement les parcelles de l'utilisateur connecté
  async findAll(utilisateurId: string) {
    return this.prisma.parcelle.findMany({
      where: {
        utilisateurId,
      },
      orderBy: {
        creeA: 'desc',
      },
    });
  }

  // Récupérer une parcelle appartenant à l'utilisateur
  async findOne(id: string, utilisateurId: string) {
    const parcelle = await this.prisma.parcelle.findFirst({
      where: {
        id,
        utilisateurId,
      },

      include: {
        pointsGPS: {
          orderBy: {
            ordre: 'asc',
          },
        },
      },
    });

    if (!parcelle) {
      throw new NotFoundException('Parcelle introuvable');
    }

    return parcelle;
  }

  async addPointsGPS(
    parcelleId: string,
    pointsGPS: {
      latitude: number;
      longitude: number;
      ordre: number;
    }[],
    utilisateurId: string,
  ) {
    // Vérifier que la parcelle appartient à l'utilisateur
    const parcelle = await this.prisma.parcelle.findFirst({
      where: {
        id: parcelleId,
        utilisateurId,
      },
    });

    if (!parcelle) {
      throw new NotFoundException('Parcelle introuvable');
    }

    // Vérifier qu'il y a au moins 3 points
    if (pointsGPS.length < 3) {
      throw new BadRequestException(
        'Une parcelle doit avoir au moins 3 points GPS.',
      );
    }

    // Enregistrer les points
    await this.prisma.pointGPS.createMany({
      data: pointsGPS.map((point) => ({
        parcelleId,
        latitude: point.latitude,
        longitude: point.longitude,
        ordre: point.ordre,
      })),
    });

    // Retourner la parcelle avec ses points
    return this.prisma.parcelle.findUnique({
      where: {
        id: parcelleId,
      },
      include: {
        pointsGPS: {
          orderBy: {
            ordre: 'asc',
          },
        },
      },
    });
  }

  async updateDelimitation(
    id: string,
    dto: ModifierDelimitationDto,
    utilisateurId: string,
  ) {
    // Vérifier que la parcelle appartient à l'utilisateur
    const parcelle = await this.prisma.parcelle.findFirst({
      where: {
        id,
        utilisateurId,
      },
    });

    if (!parcelle) {
      throw new NotFoundException('Parcelle introuvable');
    }

    // Une parcelle supprimée ne peut pas être modifiée
    if (parcelle.statut === 'SUPPRIMEE') {
      throw new BadRequestException(
        'Cette parcelle est supprimée et ne peut plus être modifiée.',
      );
    }

    // Vérifier qu'il y a au moins 3 points
    if (dto.pointsGPS.length < 3) {
      throw new BadRequestException(
        'Une parcelle doit avoir au moins 3 points GPS.',
      );
    }

    // Transaction : supprimer les anciens points,
    // créer les nouveaux et mettre à jour la superficie
    return this.prisma.$transaction(async (tx) => {
      // Supprimer les anciens points
      await tx.pointGPS.deleteMany({
        where: {
          parcelleId: id,
        },
      });

      // Créer les nouveaux points
      await tx.pointGPS.createMany({
        data: dto.pointsGPS.map((point) => ({
          parcelleId: id,
          latitude: point.latitude,
          longitude: point.longitude,
          ordre: point.ordre,
        })),
      });

      // Mettre à jour la superficie
      await tx.parcelle.update({
        where: {
          id,
        },
        data: {
          superficie: dto.superficie,
        },
      });

      // Retourner la parcelle complète
      return tx.parcelle.findUnique({
        where: {
          id,
        },
        include: {
          pointsGPS: {
            orderBy: {
              ordre: 'asc',
            },
          },
        },
      });
    });
  }

  // Modifier une parcelle
  async update(id: string, dto: UpdateParcelleDto, utilisateurId: string) {
    const parcelle = await this.prisma.parcelle.findFirst({
      where: {
        id,
        utilisateurId,
      },
    });

    if (!parcelle) {
      throw new NotFoundException('Parcelle introuvable');
    }

    // Une parcelle supprimée ne peut plus être modifiée et définitivement verrouillée
    if (parcelle.statut === 'SUPPRIMEE') {
      throw new BadRequestException(
        'Cette parcelle est supprimée et ne peut plus être modifiée.',
      );
    }

    // Vérifier le changement de statut
    if (dto.statut) {
      const statutActuel = parcelle.statut;
      const nouveauStatut = dto.statut;

      const transitionsAutorisees = {
        ACTIVE: ['ACTIVE', 'ABANDONNEE', 'ARCHIVEE'],
        ABANDONNEE: ['ABANDONNEE', 'ACTIVE', 'ARCHIVEE'],
        ARCHIVEE: ['ARCHIVEE', 'ACTIVE'],
      };

      const autorises = transitionsAutorisees[statutActuel];

      if (!autorises?.includes(nouveauStatut)) {
        throw new BadRequestException(
          `Transition de statut non autorisée : ${statutActuel} → ${nouveauStatut}.`,
        );
      }
    }

    return this.prisma.parcelle.update({
      where: {
        id,
      },
      data: {
        ...dto,
      },
    });
  }

  // Supprimer une parcelle
  async remove(id: string, raison: string, utilisateurId: string) {
    const parcelle = await this.prisma.parcelle.findFirst({
      where: {
        id,
        utilisateurId,
      },
    });

    if (!parcelle) {
      throw new NotFoundException('Parcelle introuvable');
    }

    // Vérifier la raison
    if (!raison || raison.trim() === '') {
      throw new BadRequestException(
        'La raison de suppression est obligatoire.',
      );
    }

    // Empêcher une double suppression
    if (parcelle.statut === 'SUPPRIMEE') {
      throw new BadRequestException(
        'Cette parcelle est déjà supprimée et ne peut plus être supprimée.',
      );
    }

    return this.prisma.parcelle.update({
      where: {
        id,
      },
      data: {
        statut: 'SUPPRIMEE',
        raisonSuppression: raison.trim(),
      },
    });
  }
}
