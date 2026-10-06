import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Parcelle } from './entities/parcelle.entity';
import { PointGPS } from '../points-gps/entities/point-gps.entity';
import { CreateParcelleDto } from './dto/creation-parcelle.dto';
import { UpdateParcelleDto } from './dto/modification-parcelle.dto';
import { ModifierDelimitationDto } from './dto/delimitation.dto';
import { StatutParcelle } from '../common/enums/domain.enums';
import { calculerSuperficie, centroide } from '../common/utils/geo.util';
import type { PaginatedResult } from '../common/dto/pagination.dto';
import { paginate } from '../common/dto/pagination.dto';

const TRANSITIONS_AUTORISEES: Record<string, StatutParcelle[]> = {
  ACTIVE: [
    StatutParcelle.ACTIVE,
    StatutParcelle.ABANDONNEE,
    StatutParcelle.ARCHIVEE,
  ],
  ABANDONNEE: [
    StatutParcelle.ABANDONNEE,
    StatutParcelle.ACTIVE,
    StatutParcelle.ARCHIVEE,
  ],
  ARCHIVEE: [StatutParcelle.ARCHIVEE, StatutParcelle.ACTIVE],
};

@Injectable()
export class ParcellesService {
  private readonly logger = new Logger(ParcellesService.name);

  constructor(
    @InjectRepository(Parcelle)
    private readonly parcelles: Repository<Parcelle>,
  ) {}

  // =========================
  // CREATE
  // =========================
  async create(dto: CreateParcelleDto, utilisateurId: string) {
    return this.parcelles.manager.transaction(async (manager) => {
      const points = dto.pointsGPS ?? [];

      const parcelle = manager.create(Parcelle, {
        nom: dto.nom.trim(),
        description: dto.description?.trim() ?? null,
        typeSol: dto.typeSol?.trim() ?? null,
        superficie: dto.superficie ?? null,
        latitude: dto.latitude ?? null,
        longitude: dto.longitude ?? null,
        statut: StatutParcelle.ACTIVE,
        utilisateurId,
      });

      // Si une délimitation est fournie dès la création, on en déduit
      // superficie + point d'ancrage (centre) afin que la carte mobile
      // soit immédiatement positionnée sur la parcelle.
      if (points.length >= 3) {
        const geometrie = points.map((p) => ({
          latitude: p.latitude,
          longitude: p.longitude,
        }));

        parcelle.superficie = dto.superficie ?? calculerSuperficie(geometrie);

        if (parcelle.latitude == null || parcelle.longitude == null) {
          const centre = centroide(geometrie);
          parcelle.latitude = centre?.latitude ?? null;
          parcelle.longitude = centre?.longitude ?? null;
        }
      }

      const saved = await manager.save(parcelle);

      if (points.length > 0) {
        await manager.save(
          points.map((point, index) =>
            manager.create(PointGPS, {
              parcelleId: saved.id,
              latitude: point.latitude,
              longitude: point.longitude,
              // `ordre` optionnel côté client : déduit du tableau.
              ordre: point.ordre ?? index,
            }),
          ),
        );
      }

      this.logger.log(`[create] parcelle ${saved.id} (user ${utilisateurId})`);

      return manager.findOne(Parcelle, {
        where: { id: saved.id },
        relations: { pointsGPS: true },
      });
    });
  }

  // =========================
  // READ (liste)
  // =========================
  async findAll(
    utilisateurId: string,
    page = 1,
    limit = 50,
    statut?: StatutParcelle,
  ): Promise<PaginatedResult<Parcelle>> {
    const where = {
      utilisateurId,
      ...(statut ? { statut } : {}),
    };

    const [items, total] = await this.parcelles.findAndCount({
      where,
      relations: { pointsGPS: true },
      order: { creeA: 'DESC' },
      skip: (Math.max(1, page) - 1) * Math.min(200, Math.max(1, limit)),
      take: Math.min(200, Math.max(1, limit)),
    });

    items.forEach((parcelle) => this.sortPoints(parcelle));

    return paginate(items, total, page, limit);
  }

  // =========================
  // READ (détail)
  // =========================
  async findOne(id: string, utilisateurId: string): Promise<Parcelle> {
    return this.requireOwnership(id, utilisateurId, { withPoints: true });
  }

  /**
   * Vérification d'ownership centralisée : un utilisateur ne peut jamais
   * accéder à la ressource d'un autre, même en connaissant son identifiant.
   */
  async requireOwnership(
    id: string,
    utilisateurId: string,
    options: { withPoints?: boolean; includeArchived?: boolean } = {},
  ): Promise<Parcelle> {
    const parcelle = await this.parcelles.findOne({
      where: { id, utilisateurId },
      relations: { pointsGPS: options.withPoints !== false },
    });

    this.sortPoints(parcelle);

    if (!parcelle) {
      throw new NotFoundException('Parcelle introuvable');
    }

    if (
      !options.includeArchived &&
      parcelle.statut === StatutParcelle.SUPPRIMEE
    ) {
      throw new NotFoundException('Parcelle introuvable');
    }

    return parcelle;
  }

  // =========================
  // UPDATE
  // =========================
  async update(id: string, dto: UpdateParcelleDto, utilisateurId: string) {
    const parcelle = await this.requireOwnership(id, utilisateurId, {
      withPoints: false,
      includeArchived: true,
    });

    if (parcelle.statut === StatutParcelle.SUPPRIMEE) {
      throw new BadRequestException(
        'Cette parcelle est supprimée et ne peut plus être modifiée.',
      );
    }

    if (dto.statut && (dto.statut as string) !== (parcelle.statut as string)) {
      const autorises = TRANSITIONS_AUTORISEES[parcelle.statut] ?? [];
      if (!autorises.includes(dto.statut as unknown as StatutParcelle)) {
        throw new BadRequestException(
          `Transition de statut non autorisée : ${parcelle.statut} → ${dto.statut}.`,
        );
      }
    }

    const { pointsGPS, statut, ...rest } = dto;
    void statut;

    Object.assign(parcelle, {
      ...(rest.nom !== undefined && { nom: rest.nom.trim() }),
      ...(rest.description !== undefined && {
        description: rest.description?.trim() ?? null,
      }),
      ...(rest.typeSol !== undefined && {
        typeSol: rest.typeSol?.trim() ?? null,
      }),
      ...(rest.superficie !== undefined && { superficie: rest.superficie }),
      ...(rest.latitude !== undefined && { latitude: rest.latitude }),
      ...(rest.longitude !== undefined && { longitude: rest.longitude }),
      ...(dto.statut !== undefined && {
        statut: dto.statut as unknown as StatutParcelle,
      }),
    });

    await this.parcelles.save(parcelle);

    // Une délimitation peut être mise à jour via PATCH (wizard mobile).
    if (pointsGPS && pointsGPS.length > 0) {
      return this.replacePoints(id, pointsGPS, utilisateurId);
    }

    return this.findOne(id, utilisateurId);
  }

  // =========================
  // ADD POINTS GPS
  // =========================
  async addPointsGPS(
    parcelleId: string,
    pointsGPS: { latitude: number; longitude: number; ordre?: number }[],
    utilisateurId: string,
  ) {
    await this.requireOwnership(parcelleId, utilisateurId, {
      withPoints: false,
    });

    if (pointsGPS.length < 3) {
      throw new BadRequestException(
        'Une parcelle doit avoir au moins 3 points GPS.',
      );
    }

    return this.parcelles.manager.transaction(async (manager) => {
      await manager.save(
        pointsGPS.map((point, index) =>
          manager.create(PointGPS, {
            parcelleId,
            latitude: point.latitude,
            longitude: point.longitude,
            // `ordre` est optionnel côté client : il est déduit de la
            // position dans le tableau pour garantir un polygone séquentiel.
            ordre: point.ordre ?? index,
          }),
        ),
      );

      await this.recalculateSuperficie(manager, parcelleId);

      return manager.findOne(Parcelle, {
        where: { id: parcelleId },
        relations: { pointsGPS: true },
      });
    });
  }

  // =========================
  // UPDATE DELIMITATION
  // =========================
  async updateDelimitation(
    parcelleId: string,
    dto: ModifierDelimitationDto,
    utilisateurId: string,
  ) {
    if (dto.pointsGPS.length < 3) {
      throw new BadRequestException(
        'Une parcelle doit avoir au moins 3 points GPS.',
      );
    }

    return this.replacePoints(
      parcelleId,
      dto.pointsGPS,
      utilisateurId,
      dto.superficie,
    );
  }

  /** Remplace l'intégralité de la délimitation dans une transaction. */
  async replacePoints(
    parcelleId: string,
    points: { latitude: number; longitude: number; ordre?: number }[],
    utilisateurId: string,
    superficie?: number,
  ) {
    const parcelle = await this.requireOwnership(parcelleId, utilisateurId, {
      withPoints: false,
      includeArchived: true,
    });

    if (parcelle.statut === StatutParcelle.SUPPRIMEE) {
      throw new BadRequestException(
        'Cette parcelle est supprimée et ne peut plus être modifiée.',
      );
    }

    if (points.length < 3) {
      throw new BadRequestException(
        'Une parcelle doit avoir au moins 3 points GPS.',
      );
    }

    return this.parcelles.manager.transaction(async (manager) => {
      await manager.delete(PointGPS, { parcelleId });

      await manager.save(
        points.map((point, index) =>
          manager.create(PointGPS, {
            parcelleId,
            latitude: point.latitude,
            longitude: point.longitude,
            // `ordre` est optionnel côté client : il est déduit de la
            // position dans le tableau pour garantir un polygone séquentiel.
            ordre: point.ordre ?? index,
          }),
        ),
      );

      const surface = superficie ?? calculerSuperficie(points);
      const centre = centroide(points);

      await manager.update(
        Parcelle,
        { id: parcelleId },
        {
          superficie: surface,
          ...(centre
            ? { latitude: centre.latitude, longitude: centre.longitude }
            : {}),
        },
      );

      return manager.findOne(Parcelle, {
        where: { id: parcelleId },
        relations: { pointsGPS: true },
      });
    });
  }

  // =========================
  // DELETE (suppression logique)
  // =========================
  async remove(id: string, raison: string, utilisateurId: string) {
    const parcelle = await this.requireOwnership(id, utilisateurId, {
      withPoints: false,
      includeArchived: true,
    });

    if (!raison || raison.trim() === '') {
      throw new BadRequestException(
        'La raison de suppression est obligatoire.',
      );
    }

    if (parcelle.statut === StatutParcelle.SUPPRIMEE) {
      throw new BadRequestException(
        'Cette parcelle est déjà supprimée et ne peut plus être supprimée.',
      );
    }

    parcelle.statut = StatutParcelle.SUPPRIMEE;
    parcelle.raisonSuppression = raison.trim();
    await this.parcelles.save(parcelle);

    // On ne repasse pas par findOne() : la parcelle est désormais SUPPRIMEE et
    // ne doit pas être relue via la recherche standard.
    return { ...parcelle, pointsGPS: [] };
  }

  // =========================
  // HELPERS
  // =========================
  /**
   * Les points GPS sont toujours renvoyés triés par `ordre`.
   * Le tri est fait en mémoire : `findOne` applique un `take(1)` interne qui
   * empêche TypeORM de trier sur une relation (« distinctAlias »).
   */
  private sortPoints(parcelle: Parcelle | null): Parcelle | null {
    if (parcelle?.pointsGPS) {
      parcelle.pointsGPS.sort((a, b) => a.ordre - b.ordre);
    }
    return parcelle;
  }

  private async recalculateSuperficie(
    manager: Repository<Parcelle>['manager'],
    parcelleId: string,
  ): Promise<void> {
    const points = await manager.find(PointGPS, {
      where: { parcelleId },
      order: { ordre: 'ASC' },
    });

    if (points.length < 3) return;

    const superficie = calculerSuperficie(points);
    const centre = centroide(points);

    await manager.update(
      Parcelle,
      { id: parcelleId },
      {
        superficie,
        ...(centre
          ? { latitude: centre.latitude, longitude: centre.longitude }
          : {}),
      },
    );
  }
}
