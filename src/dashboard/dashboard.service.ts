import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(userId: string) {
    const parcelles = await this.prisma.parcelle.count({
      where: {
        utilisateurId: userId,
      },
    });

    const cultures = await this.prisma.culture.count({
      where: {
        parcelle: {
          utilisateurId: userId,
        },
      },
    });

    const interventions = await this.prisma.intervention.count({
      where: {
        culture: {
          parcelle: {
            utilisateurId: userId,
          },
        },
      },
    });

    const observations = await this.prisma.observation.count({
      where: {
        culture: {
          parcelle: {
            utilisateurId: userId,
          },
        },
      },
    });

    const photos = await this.prisma.photo.count({
      where: {
        observation: {
          culture: {
            parcelle: {
              utilisateurId: userId,
            },
          },
        },
      },
    });

    return {
      parcelles,
      cultures,
      interventions,
      observations,
      photos,
    };
  }
}