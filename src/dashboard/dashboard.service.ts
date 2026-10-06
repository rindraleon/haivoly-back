import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';

import { Parcelle } from '../parcelles/entities/parcelle.entity';
import { Culture } from '../cultures/entities/culture.entity';
import { Intervention } from '../interventions/entities/intervention.entity';
import { Observation } from '../observations/entities/observation.entity';
import { Photo } from '../photos/entities/photo.entity';
import { Recolte } from '../recoltes/entities/recolte.entity';
import { Recommendation } from '../recommendations/entities/recommendation.entity';
import { StatutCulture, StatutParcelle } from '../common/enums/domain.enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Parcelle)
    private readonly parcelles: Repository<Parcelle>,
    @InjectRepository(Culture)
    private readonly cultures: Repository<Culture>,
    @InjectRepository(Intervention)
    private readonly interventions: Repository<Intervention>,
    @InjectRepository(Observation)
    private readonly observations: Repository<Observation>,
    @InjectRepository(Photo)
    private readonly photos: Repository<Photo>,
    @InjectRepository(Recolte)
    private readonly recoltes: Repository<Recolte>,
    @InjectRepository(Recommendation)
    private readonly recommendations: Repository<Recommendation>,
  ) {}

  async getDashboard(userId: string) {
    const [
      parcelles,
      parcellesActives,
      cultures,
      culturesEnCours,
      interventions,
      observations,
      photos,
      recoltes,
      recommandationsNonLues,
    ] = await Promise.all([
      this.parcelles.count({ where: { utilisateurId: userId } }),
      this.parcelles.count({
        where: { utilisateurId: userId, statut: StatutParcelle.ACTIVE },
      }),
      this.cultures.count({ where: { parcelle: { utilisateurId: userId } } }),
      this.cultures.count({
        where: {
          parcelle: { utilisateurId: userId },
          statut: StatutCulture.EN_COURS,
        },
      }),
      this.interventions.count({
        where: { culture: { parcelle: { utilisateurId: userId } } },
      }),
      this.observations.count({
        where: { culture: { parcelle: { utilisateurId: userId } } },
      }),
      this.photos.count({
        where: {
          observation: { culture: { parcelle: { utilisateurId: userId } } },
        },
      }),
      this.recoltes.count({
        where: { culture: { parcelle: { utilisateurId: userId } } },
      }),
      this.recommendations.count({ where: { userId, readAt: IsNull() } }),
    ]);

    // Superficie totale exploitée (m² puis hectares)
    const totalSuperficie = await this.parcelles
      .createQueryBuilder('p')
      .select('COALESCE(SUM(p.superficie), 0)', 'total')
      .where('p."utilisateurId" = :userId', { userId })
      .andWhere('p.statut != :statut', { statut: StatutParcelle.SUPPRIMEE })
      .getRawOne<{ total: string }>();

    return {
      parcelles,
      parcellesActives,
      cultures,
      culturesEnCours,
      interventions,
      observations,
      photos,
      recoltes,
      recommandationsNonLues,
      superficieTotaleM2: Number(totalSuperficie?.total ?? 0),
    };
  }
}
