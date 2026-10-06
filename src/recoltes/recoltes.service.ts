import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Recolte } from './entities/recolte.entity';
import { PhotoRecolte } from '../photos-recoltes/entities/photo-recolte.entity';
import { Culture } from '../cultures/entities/culture.entity';
import { StatutCulture } from '../common/enums/domain.enums';
import { CreateRecolteDto, UpdateRecolteDto } from './dto/recolte.dto';
import { requireDateOnly, toDateOnly } from '../common/utils/date.util';
import { statutCultureAJour } from '../common/utils/culture-statut.util';
import type { PaginatedResult } from '../common/dto/pagination.dto';
import { paginate } from '../common/dto/pagination.dto';

@Injectable()
export class RecoltesService {
  private readonly logger = new Logger(RecoltesService.name);

  constructor(
    @InjectRepository(Recolte)
    private readonly recoltes: Repository<Recolte>,
    @InjectRepository(Culture)
    private readonly cultures: Repository<Culture>,
    @InjectRepository(PhotoRecolte)
    private readonly photoRecoltes: Repository<PhotoRecolte>,
  ) {}

  // =========================
  // CREATE — règle métier transactionnelle
  // =========================
  /**
   * Créer une récolte déclenche AUTOMATIQUEMENT le passage de la culture au
   * statut RECOLTEE. Les deux écritures sont dans la même transaction :
   * soit tout réussit, soit rien n'est appliqué.
   *
   * Le client ne peut donc jamais imposer `statut = RECOLTEE` à la place du
   * backend.
   */
  async create(
    cultureId: string,
    dto: CreateRecolteDto,
    utilisateurId: string,
  ) {
    const culture = await this.cultures.findOne({
      where: { id: cultureId, parcelle: { utilisateurId } },
    });

    if (!culture || culture.statut === StatutCulture.SUPPRIMEE) {
      throw new NotFoundException('Culture introuvable');
    }

    // Une culture dont la date de plantation est atteinte est « en cours » :
    // on applique la même règle serveur que la lecture des cultures, sans quoi
    // une culture mûre resterait bloquée en PLANIFIEE et ne pourrait jamais
    // être récoltée.
    const statutAJour = statutCultureAJour(
      culture.statut,
      culture.datePlantation,
    );

    if (statutAJour !== StatutCulture.EN_COURS) {
      throw new BadRequestException(
        'Seule une culture en cours peut être récoltée',
      );
    }

    const existante = await this.recoltes.findOne({ where: { cultureId } });
    if (existante) {
      throw new ConflictException('Cette culture possède déjà une récolte');
    }

    // Date calendaire : comparée sous forme de chaîne `YYYY-MM-DD`
    // (l'ordre lexicographique est identique à l'ordre chronologique).
    const dateRecolte = requireDateOnly(dto.dateRecolte, 'dateRecolte');

    // `datePlantation` peut remonter soit en chaîne `YYYY-MM-DD`, soit en
    // `Date` (selon l'hydratation TypeORM) : `toDateOnly` normalise les deux,
    // sans jamais produire de décalage de fuseau.
    const plantation = toDateOnly(culture.datePlantation);

    if (plantation && dateRecolte < plantation) {
      throw new BadRequestException(
        'La date de récolte ne peut pas être avant la date de plantation',
      );
    }

    const recolte = await this.recoltes.manager.transaction(async (manager) => {
      const created = await manager.save(
        manager.create(Recolte, {
          dateRecolte,
          quantite: dto.quantite,
          unite: dto.unite.trim(),
          description: dto.description?.trim() ?? null,
          prixVente: dto.prixVente ?? null,
          coutRecolte: dto.coutRecolte ?? null,
          cultureId,
        }),
      );

      // ➜ Transition automatique du cycle de vie de la culture
      await manager.update(
        Culture,
        { id: cultureId },
        { statut: StatutCulture.RECOLTEE },
      );

      this.logger.log(
        `[create] récolte ${created.id} → culture ${cultureId} = RECOLTEE`,
      );

      return created;
    });

    return this.recoltes.findOne({
      where: { id: recolte.id },
      relations: { photos: true },
    });
  }

  // =========================
  // READ
  // =========================
  async findAll(
    utilisateurId: string,
    page = 1,
    limit = 50,
  ): Promise<PaginatedResult<Recolte>> {
    const [items, total] = await this.recoltes.findAndCount({
      where: { culture: { parcelle: { utilisateurId } } },
      relations: { culture: { parcelle: true }, photos: true },
      order: { dateRecolte: 'DESC' },
      skip: (Math.max(1, page) - 1) * Math.min(200, Math.max(1, limit)),
      take: Math.min(200, Math.max(1, limit)),
    });

    return paginate(items, total, page, limit);
  }

  async findOne(cultureId: string, utilisateurId: string): Promise<Recolte> {
    const culture = await this.cultures.findOne({
      where: { id: cultureId, parcelle: { utilisateurId } },
    });

    if (!culture || culture.statut === StatutCulture.SUPPRIMEE) {
      throw new NotFoundException('Culture introuvable');
    }

    const recolte = await this.recoltes.findOne({
      where: { cultureId },
      relations: { photos: true },
      order: { photos: { dateAjout: 'DESC' } },
    });

    if (!recolte) {
      throw new NotFoundException(
        'Aucune récolte enregistrée pour cette culture',
      );
    }

    return recolte;
  }

  async requireOwnedRecolte(
    recolteId: string,
    utilisateurId: string,
  ): Promise<Recolte> {
    const recolte = await this.recoltes.findOne({
      where: { id: recolteId, culture: { parcelle: { utilisateurId } } },
      relations: { culture: true },
    });

    if (!recolte) {
      throw new NotFoundException('Récolte introuvable');
    }

    return recolte;
  }

  // =========================
  // UPDATE / DELETE — règles métier préservées
  // =========================
  /**
   * Une récolte fait partie de l'historique d'une culture récoltée :
   * sa modification est refusée (comportement métier historique conservé).
   */
  async update(id: string, _dto: UpdateRecolteDto, utilisateurId: string) {
    await this.requireOwnedRecolte(id, utilisateurId);
    throw new BadRequestException(
      'Une récolte appartenant à une culture récoltée ne peut plus être modifiée',
    );
  }

  /** Idem : la suppression casserait l'historique. */
  async remove(id: string, utilisateurId: string) {
    await this.requireOwnedRecolte(id, utilisateurId);
    throw new BadRequestException(
      'Impossible de supprimer une récolte d’une culture récoltée',
    );
  }

  // =========================
  // PHOTOS
  // =========================
  async uploadPhoto(recolteId: string, utilisateurId: string, url: string) {
    const recolte = await this.requireOwnedRecolte(recolteId, utilisateurId);

    if (recolte.culture.statut !== StatutCulture.RECOLTEE) {
      throw new BadRequestException(
        'La culture doit être récoltée pour ajouter une photo',
      );
    }

    return this.photoRecoltes.save(
      this.photoRecoltes.create({ url, recolteId }),
    );
  }
}
