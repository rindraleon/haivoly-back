/* eslint-disable @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRecommendationDto } from './dto/create-recommendation.dto';

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRecommendationDto) {
    // Broadcast : si userId === 'all', créer pour tous les utilisateurs
    if (dto.userId === 'all') {
      const users = await this.prisma.utilisateur.findMany({
        select: { id: true },
      });
      const created = await Promise.all(
        users.map((u) =>
          this.prisma.recommendation.create({
            data: {
              userId: u.id,
              title: dto.title,
              message: dto.message,
              type: dto.type ?? 'INFO',
              priority: dto.priority ?? 'MEDIUM',
              expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            },
          }),
        ),
      );
      return { count: created.length, recommendations: created };
    }

    const rec = await this.prisma.recommendation.create({
      data: {
        userId: dto.userId,
        title: dto.title,
        message: dto.message,
        type: dto.type ?? 'INFO',
        priority: dto.priority ?? 'MEDIUM',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
      include: {
        utilisateur: {
          select: { id: true, nom: true, prenom: true, email: true },
        },
      },
    });
    return rec;
  }

  async findAll(query: {
    userId?: string;
    type?: string;
    priority?: string;
    unread?: string;
    page?: number;
    limit?: number;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.userId) where.userId = query.userId;
    if (query.type) where.type = query.type;
    if (query.priority) where.priority = query.priority;
    if (query.unread === 'true') where.readAt = null;

    const [data, total] = await Promise.all([
      this.prisma.recommendation.findMany({
        where,
        include: {
          utilisateur: {
            select: { id: true, nom: true, prenom: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.recommendation.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findForUser(userId: string, includeRead = true) {
    const where: any = { userId };
    if (!includeRead) where.readAt = null;
    return this.prisma.recommendation.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(id: string) {
    return this.prisma.recommendation.update({
      where: { id },
      data: { readAt: new Date() },
    });
  }

  async markAllReadForUser(userId: string) {
    return this.prisma.recommendation.updateMany({
      where: { userId, readAt: null },
      data: { readAt: new Date() },
    });
  }

  async remove(id: string) {
    return this.prisma.recommendation.delete({ where: { id } });
  }
}
