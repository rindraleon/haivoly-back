import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Photo } from './entities/photo.entity';
import { Observation } from '../observations/entities/observation.entity';
import { StatutCulture } from '../common/enums/domain.enums';
import { normalizeUploadUrl } from '../common/utils/upload.util';
import { CreatePhotoDto, UpdatePhotoDto } from './dto/photo.dto';

@Injectable()
export class PhotosService {
  constructor(
    @InjectRepository(Photo)
    private readonly photos: Repository<Photo>,
    @InjectRepository(Observation)
    private readonly observations: Repository<Observation>,
  ) {}

  private async requireObservation(
    observationId: string,
    utilisateurId: string,
    cultureId?: string,
  ): Promise<Observation> {
    const observation = await this.observations.findOne({
      where: {
        id: observationId,
        ...(cultureId ? { cultureId } : {}),
        culture: { parcelle: { utilisateurId } },
      },
      relations: { culture: true },
    });

    if (
      !observation ||
      observation.culture?.statut === StatutCulture.SUPPRIMEE
    ) {
      throw new NotFoundException('Observation introuvable');
    }

    return observation;
  }

  private assertModifiable(observation: Observation, action: string): void {
    const statut = observation.culture?.statut;
    if (
      statut === StatutCulture.RECOLTEE ||
      statut === StatutCulture.ABANDONNEE
    ) {
      throw new ForbiddenException(
        `Impossible de ${action} une photo d’une observation d’une culture terminée`,
      );
    }
  }

  async create(
    observationId: string,
    cultureId: string,
    dto: CreatePhotoDto,
    utilisateurId: string,
  ) {
    const observation = await this.requireObservation(
      observationId,
      utilisateurId,
      cultureId,
    );
    this.assertModifiable(observation, 'ajouter');

    return this.photos.save(
      this.photos.create({
        url: normalizeUploadUrl(dto.url, 'observations'),
        observationId,
      }),
    );
  }

  async upload(
    observationId: string,
    cultureId: string,
    utilisateurId: string,
    relativeUrl: string,
  ) {
    const observation = await this.requireObservation(
      observationId,
      utilisateurId,
      cultureId,
    );
    this.assertModifiable(observation, 'ajouter');

    return this.photos.save(
      this.photos.create({ url: relativeUrl, observationId }),
    );
  }

  async findAll(
    observationId: string,
    cultureId: string,
    utilisateurId: string,
  ) {
    await this.requireObservation(observationId, utilisateurId, cultureId);

    return this.photos.find({
      where: { observationId },
      order: { dateAjout: 'DESC' },
    });
  }

  async findOne(
    observationId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    await this.requireObservation(observationId, utilisateurId, cultureId);

    const photo = await this.photos.findOne({ where: { id, observationId } });
    if (!photo) {
      throw new NotFoundException('Photo introuvable');
    }

    return photo;
  }

  async update(
    observationId: string,
    cultureId: string,
    id: string,
    dto: UpdatePhotoDto,
    utilisateurId: string,
  ) {
    const observation = await this.requireObservation(
      observationId,
      utilisateurId,
      cultureId,
    );
    this.assertModifiable(observation, 'modifier');

    const photo = await this.findOne(
      observationId,
      cultureId,
      id,
      utilisateurId,
    );

    if (dto.url !== undefined) {
      photo.url = normalizeUploadUrl(dto.url, 'observations');
    }

    return this.photos.save(photo);
  }

  async remove(
    observationId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    const observation = await this.requireObservation(
      observationId,
      utilisateurId,
      cultureId,
    );
    this.assertModifiable(observation, 'supprimer');

    const photo = await this.findOne(
      observationId,
      cultureId,
      id,
      utilisateurId,
    );
    await this.photos.remove(photo);

    return { id, deleted: true };
  }
}
