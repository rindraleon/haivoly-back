/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateActionDto } from './dto/create-action.dto';

@Injectable()
export class ActionsService {
  private readonly logger = new Logger(ActionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateActionDto) {
    // Idempotence via clientId
    if (dto.clientId) {
      const existing = await this.prisma.action.findUnique({
        where: { clientId: dto.clientId },
      });
      if (existing) {
        return { id: dto.clientId, status: 'DUPLICATE', action: existing };
      }
    }

    const action = await this.prisma.action.create({
      data: {
        clientId: dto.clientId,
        userId,
        actionType: dto.actionType,
        entityType: dto.entityType,
        entityId: dto.entityId,
        payload: dto.payload as any,
        deviceId: dto.deviceId,
        timestamp: dto.timestamp ? new Date(dto.timestamp) : new Date(),
        syncStatus: 'SYNCED',
        syncedAt: new Date(),
        metadata: dto.metadata as any,
      },
      include: {
        utilisateur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });

    // Déclencher règles de recommandation (extensible)
    await this.triggerRecommendations(action);

    return { id: action.clientId ?? action.id, status: 'SYNCED', action };
  }

  async batchSync(userId: string, actions: CreateActionDto[]) {
    const results: Array<{ id: string; status: string; message?: string }> = [];

    for (const dto of actions) {
      try {
        // Validation simple
        if (!dto.actionType || !dto.entityType) {
          results.push({
            id: dto.clientId ?? 'unknown',
            status: 'INVALID',
            message: 'actionType/entityType requis',
          });
          continue;
        }

        if (dto.clientId) {
          const dup = await this.prisma.action.findUnique({
            where: { clientId: dto.clientId },
          });
          if (dup) {
            results.push({ id: dto.clientId, status: 'DUPLICATE' });
            continue;
          }
        }

        const res = await this.create(userId, dto);
        results.push({ id: dto.clientId ?? res.action.id, status: res.status });
      } catch (e: any) {
        this.logger.error(`batchSync error for ${dto.clientId}`, e);
        results.push({
          id: dto.clientId ?? 'unknown',
          status: 'FAILED',
          message: e.message,
        });
      }
    }

    return { results };
  }

  async findAll(query: {
    userId?: string;
    actionType?: string;
    entityType?: string;
    syncStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
    sort?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.actionType) where.actionType = query.actionType;
    if (query.entityType) where.entityType = query.entityType;
    if (query.syncStatus) where.syncStatus = query.syncStatus;
    if (query.search) {
      where.OR = [
        { actionType: { contains: query.search, mode: 'insensitive' } },
        { entityType: { contains: query.search, mode: 'insensitive' } },
        { entityId: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.action.findMany({
        where,
        include: {
          utilisateur: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.action.count({ where }),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    return this.prisma.action.findUnique({
      where: { id },
      include: {
        utilisateur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });
  }

  async getDashboardStats() {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    const [totalUsers, totalActions, today, synced, pending, failed, recos] =
      await Promise.all([
        this.prisma.utilisateur.count(),
        this.prisma.action.count(),
        this.prisma.action.count({ where: { timestamp: { gte: startOfDay } } }),
        this.prisma.action.count({ where: { syncStatus: 'SYNCED' } }),
        this.prisma.action.count({
          where: { syncStatus: { in: ['PENDING', 'SYNCING'] } },
        }),
        this.prisma.action.count({ where: { syncStatus: 'FAILED' } }),
        this.prisma.recommendation.count(),
      ]);

    const syncRate = totalActions
      ? Math.round((synced / totalActions) * 1000) / 10
      : 100;

    return {
      totalUsers,
      actionsToday: today,
      actionsSynced: synced,
      actionsPending: pending,
      actionsFailed: failed,
      totalActions,
      recommendations: recos,
      syncRate,
    };
  }

  // Règles métier extensibles pour recommandations
  private async triggerRecommendations(action: any) {
    try {
      // Exemple : si CREATE_PARCELLE → recommandation bienvenue
      // Exemple : si actionType contient IRRIGATION et payload humidité basse → HIGH
      // On garde simple et extensible : chaque règle est une fonction

      const rules: Array<(a: any) => Promise<void>> = [
        async (a) => {
          if (a.actionType === 'CREATE_PARCELLE') {
            await this.prisma.recommendation.create({
              data: {
                userId: a.userId,
                title: 'Bienvenue — première parcelle créée',
                message: `Parcelle "${a.payload?.nom ?? a.entityId}" créée. Pensez à délimiter la zone GPS pour calculer la superficie.`,
                type: 'SUCCESS',
                priority: 'MEDIUM',
                metadata: { actionId: a.id, entityType: a.entityType },
              },
            });
          }
        },
        async (a) => {
          if (
            a.actionType === 'CREATE_OBSERVATION' &&
            a.payload?.humidite != null &&
            a.payload.humidite < 30
          ) {
            await this.prisma.recommendation.create({
              data: {
                userId: a.userId,
                title: 'Irrigation recommandée',
                message: `Humidité basse (${a.payload.humidite}%) détectée. Prévoir irrigation dans 24h.`,
                type: 'WARNING',
                priority: 'HIGH',
                metadata: { actionId: a.id },
              },
            });
          }
        },
      ];

      for (const rule of rules) {
        try {
          await rule(action);
        } catch (e) {
          this.logger.warn(`rule failed: ${e}`);
        }
      }
    } catch (e) {
      this.logger.error('triggerRecommendations error', e);
    }
  }
}
