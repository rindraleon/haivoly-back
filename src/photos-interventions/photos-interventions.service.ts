import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PhotoIntervention } from './entities/photo-intervention.entity';
import { Intervention } from '../interventions/entities/intervention.entity';
import { StatutCulture } from '../common/enums/domain.enums';
import { normalizeUploadUrl } from '../common/utils/upload.util';

@Injectable()
export class PhotosInterventionsService {
  constructor(
    @InjectRepository(PhotoIntervention)
    private readonly photos: Repository<PhotoIntervention>,
    @InjectRepository(Intervention)
    private readonly interventions: Repository<Intervention>,
  ) {}

  private async requireIntervention(
    interventionId: string,
    utilisateurId: string,
    cultureId?: string,
  ): Promise<Intervention> {
    const intervention = await this.interventions.findOne({
      where: {
        id: interventionId,
        ...(cultureId ? { cultureId } : {}),
        culture: { parcelle: { utilisateurId } },
      },
      relations: { culture: true },
    });

    if (
      !intervention ||
      intervention.culture?.statut === StatutCulture.SUPPRIMEE
    ) {
      throw new NotFoundException('Intervention introuvable');
    }

    return intervention;
  }

  private assertModifiable(intervention: Intervention, action: string): void {
    const statut = intervention.culture?.statut;
    if (
      statut === StatutCulture.RECOLTEE ||
      statut === StatutCulture.ABANDONNEE
    ) {
      throw new ForbiddenException(
        `Impossible de ${action} une photo d’une intervention d’une culture terminée`,
      );
    }
  }

  async create(
    interventionId: string,
    cultureId: string,
    dto: { url: string; description?: string },
    utilisateurId: string,
  ) {
    const intervention = await this.requireIntervention(
      interventionId,
      utilisateurId,
      cultureId,
    );
    this.assertModifiable(intervention, 'ajouter');

    return this.photos.save(
      this.photos.create({
        url: normalizeUploadUrl(dto.url, 'interventions'),
        description: dto.description?.trim() ?? null,
        interventionId,
      }),
    );
  }

  async upload(
    interventionId: string,
    cultureId: string,
    utilisateurId: string,
    relativeUrl: string,
  ) {
    const intervention = await this.requireIntervention(
      interventionId,
      utilisateurId,
      cultureId,
    );
    this.assertModifiable(intervention, 'ajouter');

    return this.photos.save(
      this.photos.create({ url: relativeUrl, interventionId }),
    );
  }

  async findAll(
    interventionId: string,
    cultureId: string,
    utilisateurId: string,
  ) {
    await this.requireIntervention(interventionId, utilisateurId, cultureId);
    return this.photos.find({
      where: { interventionId },
      order: { dateAjout: 'DESC' },
    });
  }

  async findOne(
    interventionId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    await this.requireIntervention(interventionId, utilisateurId, cultureId);

    const photo = await this.photos.findOne({
      where: { id, interventionId },
    });

    if (!photo) {
      throw new NotFoundException('Photo introuvable');
    }

    return photo;
  }

  async update(
    interventionId: string,
    cultureId: string,
    id: string,
    dto: { url?: string; description?: string },
    utilisateurId: string,
  ) {
    const intervention = await this.requireIntervention(
      interventionId,
      utilisateurId,
      cultureId,
    );
    this.assertModifiable(intervention, 'modifier');

    if (dto.url === undefined && dto.description === undefined) {
      throw new BadRequestException('Aucune modification fournie');
    }

    const photo = await this.findOne(
      interventionId,
      cultureId,
      id,
      utilisateurId,
    );

    if (dto.url !== undefined) {
      photo.url = normalizeUploadUrl(dto.url, 'interventions');
    }
    if (dto.description !== undefined) {
      photo.description = dto.description.trim();
    }

    return this.photos.save(photo);
  }

  async remove(
    interventionId: string,
    cultureId: string,
    id: string,
    utilisateurId: string,
  ) {
    const intervention = await this.requireIntervention(
      interventionId,
      utilisateurId,
      cultureId,
    );
    this.assertModifiable(intervention, 'supprimer');

    const photo = await this.findOne(
      interventionId,
      cultureId,
      id,
      utilisateurId,
    );
    await this.photos.remove(photo);

    return { id, deleted: true };
  }
}
