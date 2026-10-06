import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PhotoRecolte } from './entities/photo-recolte.entity';
import { Recolte } from '../recoltes/entities/recolte.entity';
import { StatutCulture } from '../common/enums/domain.enums';
import { normalizeUploadUrl } from '../common/utils/upload.util';

@Injectable()
export class PhotosRecoltesService {
  constructor(
    @InjectRepository(PhotoRecolte)
    private readonly photos: Repository<PhotoRecolte>,
    @InjectRepository(Recolte)
    private readonly recoltes: Repository<Recolte>,
  ) {}

  private async requireRecolte(
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

  private assertRecoltee(recolte: Recolte): void {
    if (recolte.culture?.statut !== StatutCulture.RECOLTEE) {
      throw new BadRequestException(
        'La culture doit être récoltée pour ajouter une photo',
      );
    }
  }

  async create(recolteId: string, dto: { url: string }, utilisateurId: string) {
    const recolte = await this.requireRecolte(recolteId, utilisateurId);
    this.assertRecoltee(recolte);

    return this.photos.save(
      this.photos.create({
        url: normalizeUploadUrl(dto.url, 'recoltes'),
        recolteId,
      }),
    );
  }

  async upload(recolteId: string, utilisateurId: string, relativeUrl: string) {
    const recolte = await this.requireRecolte(recolteId, utilisateurId);
    this.assertRecoltee(recolte);

    return this.photos.save(
      this.photos.create({ url: relativeUrl, recolteId }),
    );
  }

  async findAll(recolteId: string, utilisateurId: string) {
    await this.requireRecolte(recolteId, utilisateurId);
    return this.photos.find({
      where: { recolteId },
      order: { dateAjout: 'DESC' },
    });
  }

  async findOne(recolteId: string, id: string, utilisateurId: string) {
    await this.requireRecolte(recolteId, utilisateurId);

    const photo = await this.photos.findOne({ where: { id, recolteId } });
    if (!photo) {
      throw new NotFoundException('Photo introuvable');
    }

    return photo;
  }

  async update(
    recolteId: string,
    id: string,
    dto: { url?: string },
    utilisateurId: string,
  ) {
    const recolte = await this.requireRecolte(recolteId, utilisateurId);
    this.assertRecoltee(recolte);

    const photo = await this.findOne(recolteId, id, utilisateurId);

    if (dto.url !== undefined) {
      photo.url = normalizeUploadUrl(dto.url, 'recoltes');
    }

    return this.photos.save(photo);
  }

  async remove(recolteId: string, id: string, utilisateurId: string) {
    const recolte = await this.requireRecolte(recolteId, utilisateurId);
    this.assertRecoltee(recolte);

    const photo = await this.findOne(recolteId, id, utilisateurId);
    await this.photos.remove(photo);

    return { id, deleted: true };
  }
}
