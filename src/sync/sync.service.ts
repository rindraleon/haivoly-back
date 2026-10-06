/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SyncDto } from './dto/sync.dto';
import { calculerSuperficie } from '../parcelles/utils/geo.util';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  async synchronize(userId: string, dto: SyncDto) {
    const lastSync = dto.lastSync ? new Date(dto.lastSync) : new Date(0);

    // =====================================================
    // 1. MOBILE → SERVEUR
    // =====================================================

    // -----------------------------------------------------
    // PARCELLES
    // -----------------------------------------------------
    if (dto.parcelles?.length) {
      for (const parcelle of dto.parcelles) {
        await this.prisma.parcelle.upsert({
          where: {
            id: parcelle.id,
          },

          update: {
            nom: parcelle.nom,
            description: parcelle.description,
            superficie: parcelle.superficie,
            typeSol: parcelle.typeSol,
            latitude: parcelle.latitude,
            longitude: parcelle.longitude,
          },

          create: {
            id: parcelle.id,
            nom: parcelle.nom,
            description: parcelle.description,
            superficie: parcelle.superficie,
            typeSol: parcelle.typeSol,
            latitude: parcelle.latitude,
            longitude: parcelle.longitude,

            utilisateur: {
              connect: {
                id: userId,
              },
            },
          },
        });
      }
    }

    // -----------------------------------------------------
    // CULTURES
    // -----------------------------------------------------
    if (dto.cultures?.length) {
      for (const culture of dto.cultures) {
        await this.prisma.culture.upsert({
          where: {
            id: culture.id,
          },

          update: {
            nom: culture.nom,
            type: culture.type,
            datePlantation: culture.datePlantation
              ? new Date(culture.datePlantation)
              : null,
            stade: culture.stade,
          },

          create: {
            id: culture.id,
            nom: culture.nom,
            type: culture.type,
            datePlantation: culture.datePlantation
              ? new Date(culture.datePlantation)
              : null,
            stade: culture.stade,
            parcelleId: culture.parcelleId,
          },
        });
      }
    }

    // -----------------------------------------------------
    // INTERVENTIONS
    // -----------------------------------------------------
    if (dto.interventions?.length) {
      for (const intervention of dto.interventions) {
        await this.prisma.intervention.upsert({
          where: {
            id: intervention.id,
          },

          update: {
            type: intervention.type,
            description: intervention.description,
            date: intervention.date ? new Date(intervention.date) : undefined,
          },

          create: {
            id: intervention.id,
            type: intervention.type,
            description: intervention.description,
            date: intervention.date ? new Date(intervention.date) : new Date(),
            cultureId: intervention.cultureId,
          },
        });
      }
    }

    // -----------------------------------------------------
    // OBSERVATIONS
    // -----------------------------------------------------
    if (dto.observations?.length) {
      for (const observation of dto.observations) {
        await this.prisma.observation.upsert({
          where: {
            id: observation.id,
          },

          update: {
            description: observation.description,
            date: observation.date ? new Date(observation.date) : undefined,
          },

          create: {
            id: observation.id,
            description: observation.description,
            date: observation.date ? new Date(observation.date) : new Date(),
            cultureId: observation.cultureId,
          },
        });
      }
    }

    // -----------------------------------------------------
    // PHOTOS
    // -----------------------------------------------------
    if (dto.photos?.length) {
      for (const photo of dto.photos) {
        await this.prisma.photo.upsert({
          where: {
            id: photo.id,
          },

          update: {
            url: photo.url,
          },

          create: {
            id: photo.id,
            url: photo.url,
            dateAjout: photo.dateAjout ? new Date(photo.dateAjout) : new Date(),
            observationId: photo.observationId,
          },
        });
      }
    }

    // -----------------------------------------------------
    // POINTS GPS
    // -----------------------------------------------------
    if (dto.pointsGPS?.length) {
      for (const point of dto.pointsGPS) {
        const existingPoint = await this.prisma.pointGPS.findUnique({
          where: {
            id: point.id,
          },
        });

        if (!existingPoint) {
          // Nouveau point GPS
          await this.prisma.pointGPS.create({
            data: {
              id: point.id,
              ordre: point.ordre,
              latitude: point.latitude,
              longitude: point.longitude,
              parcelleId: point.parcelleId,
            },
          });
        } else {
          // Vérifier si le point a réellement changé
          const hasChanged =
            existingPoint.ordre !== point.ordre ||
            existingPoint.latitude !== point.latitude ||
            existingPoint.longitude !== point.longitude ||
            existingPoint.parcelleId !== point.parcelleId;

          if (hasChanged) {
            await this.prisma.pointGPS.update({
              where: {
                id: point.id,
              },
              data: {
                ordre: point.ordre,
                latitude: point.latitude,
                longitude: point.longitude,
                parcelleId: point.parcelleId,
              },
            });
          }
        }
      }
    }

    // -----------------------------------------------------
    // CALCUL DE LA SUPERFICIE DES PARCELLES
    // -----------------------------------------------------

    const parcelleIds = [
      ...new Set((dto.pointsGPS ?? []).map((point) => point.parcelleId)),
    ];

    for (const parcelleId of parcelleIds) {
      // Récupérer tous les points GPS de la parcelle
      const points = await this.prisma.pointGPS.findMany({
        where: {
          parcelleId,
        },
        orderBy: {
          ordre: 'asc',
        },
      });

      // Une parcelle doit avoir au minimum 3 points
      if (points.length >= 3) {
        const superficie = calculerSuperficie(
          points.map((point) => ({
            latitude: point.latitude,
            longitude: point.longitude,
          })),
        );

        // Récupérer la parcelle
        const parcelle = await this.prisma.parcelle.findUnique({
          where: {
            id: parcelleId,
          },
        });

        // Mettre à jour uniquement si la superficie a réellement changé
        if (parcelle && parcelle.superficie !== superficie) {
          await this.prisma.parcelle.update({
            where: {
              id: parcelleId,
            },
            data: {
              superficie,
            },
          });
        }
      }
    }

    // =====================================================
    // 2. SERVEUR → MOBILE
    // =====================================================

    // -----------------------------------------------------
    // PARCELLES
    // -----------------------------------------------------
    const parcelles = await this.prisma.parcelle.findMany({
      where: {
        utilisateurId: userId,
        modifieA: {
          gt: lastSync,
        },
      },
    });

    // -----------------------------------------------------
    // CULTURES
    // -----------------------------------------------------
    const cultures = await this.prisma.culture.findMany({
      where: {
        parcelle: {
          utilisateurId: userId,
        },

        modifieA: {
          gt: lastSync,
        },
      },
    });

    // -----------------------------------------------------
    // INTERVENTIONS
    // -----------------------------------------------------
    const interventions = await this.prisma.intervention.findMany({
      where: {
        culture: {
          parcelle: {
            utilisateurId: userId,
          },
        },

        modifieA: {
          gt: lastSync,
        },
      },
    });

    // -----------------------------------------------------
    // OBSERVATIONS
    // -----------------------------------------------------
    const observations = await this.prisma.observation.findMany({
      where: {
        culture: {
          parcelle: {
            utilisateurId: userId,
          },
        },

        modifieA: {
          gt: lastSync,
        },
      },
    });

    // -----------------------------------------------------
    // PHOTOS
    // -----------------------------------------------------
    const photos = await this.prisma.photo.findMany({
      where: {
        observation: {
          culture: {
            parcelle: {
              utilisateurId: userId,
            },
          },
        },

        dateAjout: {
          gt: lastSync,
        },
      },
    });

    // -----------------------------------------------------
    // POINTS GPS
    // -----------------------------------------------------
    const pointsGPS = await this.prisma.pointGPS.findMany({
      where: {
        parcelle: {
          utilisateurId: userId,
        },
        modifieA: {
          gt: lastSync,
        },
      },
    });

    // =====================================================
    // 3. RÉPONSE
    // =====================================================

    return {
      success: true,

      syncedAt: new Date().toISOString(),

      changes: {
        parcelles,
        cultures,
        interventions,
        observations,
        photos,
        pointsGPS,
      },
    };
  }
}
