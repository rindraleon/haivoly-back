import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Utilisateur } from './entities/utilisateur.entity';
import { UpdateProfileDto } from './dto/update-profile.dto';

export interface ProfilUtilisateur {
  id: string;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  role: string;
  creeA: Date;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Utilisateur)
    private readonly utilisateurs: Repository<Utilisateur>,
  ) {}

  async findById(id: string): Promise<ProfilUtilisateur> {
    const utilisateur = await this.utilisateurs.findOne({ where: { id } });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    return this.toProfil(utilisateur);
  }

  async updateProfile(
    id: string,
    dto: UpdateProfileDto,
  ): Promise<ProfilUtilisateur> {
    const utilisateur = await this.utilisateurs.findOne({ where: { id } });

    if (!utilisateur) {
      throw new NotFoundException('Utilisateur introuvable');
    }

    Object.assign(utilisateur, {
      ...(dto.nom !== undefined && { nom: dto.nom.trim() }),
      ...(dto.prenom !== undefined && { prenom: dto.prenom?.trim() ?? null }),
      ...(dto.telephone !== undefined && {
        telephone: dto.telephone?.trim() ?? null,
      }),
    });

    return this.toProfil(await this.utilisateurs.save(utilisateur));
  }

  private toProfil(utilisateur: Utilisateur): ProfilUtilisateur {
    return {
      id: utilisateur.id,
      nom: utilisateur.nom,
      prenom: utilisateur.prenom,
      email: utilisateur.email,
      telephone: utilisateur.telephone,
      role: utilisateur.role,
      creeA: utilisateur.creeA,
    };
  }
}
