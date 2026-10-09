import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

import { PointGPS } from './entities/point-gps.entity';
import { Parcelle } from '../parcelles/entities/parcelle.entity';
import { calculerSuperficie, centroide } from '../common/utils/geo.util';

@Injectable()
export class PointsGpsService {
  constructor(
    @InjectRepository(PointGPS)
    private readonly points: Repository<PointGPS>,
  ) {}

  listForParcelle(parcelleId: string): Promise<PointGPS[]> {
    return this.points.find({
      where: { parcelleId },
      order: { ordre: 'ASC' },
    });
  }

  async replaceForParcelle(
    manager: EntityManager,
    parcelleId: string,
    points: { latitude: number; longitude: number; ordre: number }[],
  ): Promise<PointGPS[]> {
    await manager.delete(PointGPS, { parcelleId });

    const created = await manager.save(
      points.map((point) =>
        manager.create(PointGPS, {
          parcelleId,
          latitude: point.latitude,
          longitude: point.longitude,
          ordre: point.ordre,
        }),
      ),
    );

    if (points.length >= 3) {
      const centre = centroide(points);
      await manager.update(
        Parcelle,
        { id: parcelleId },
        {
          superficie: calculerSuperficie(points),
          ...(centre
            ? { latitude: centre.latitude, longitude: centre.longitude }
            : {}),
        },
      );
    }

    return created;
  }
}
