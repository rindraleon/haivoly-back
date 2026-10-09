import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { Repository } from 'typeorm';

import { Utilisateur } from '../users/entities/utilisateur.entity';
import { PasswordResetToken } from './entities/password-reset-token.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from './mail.service';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator';

export interface PublicUtilisateur {
  id: string;
  nom: string;
  prenom: string | null;
  email: string;
  telephone: string | null;
  role: string;
  creeA: Date;
}

const BCRYPT_ROUNDS = 10;
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 heure

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(Utilisateur)
    private readonly utilisateurs: Repository<Utilisateur>,
    @InjectRepository(PasswordResetToken)
    private readonly resetTokens: Repository<PasswordResetToken>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  /** Ne jamais renvoyer le hash du mot de passe. */
  private toPublic(user: Utilisateur): PublicUtilisateur {
    return {
      id: user.id,
      nom: user.nom,
      prenom: user.prenom,
      email: user.email,
      telephone: user.telephone,
      role: user.role,
      creeA: user.creeA,
    };
  }

  async register(dto: RegisterDto): Promise<PublicUtilisateur> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.utilisateurs.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const utilisateur = this.utilisateurs.create({
      nom: dto.nom.trim(),
      prenom: dto.prenom?.trim() ?? null,
      email,
      telephone: dto.telephone?.trim() ?? null,
      password: await bcrypt.hash(dto.password, BCRYPT_ROUNDS),
    });

    const saved = await this.utilisateurs.save(utilisateur);
    this.logger.log(`[register] Nouvel utilisateur ${saved.id}`);

    return this.toPublic(saved);
  }

  async login(dto: LoginDto): Promise<{
    access_token: string;
    utilisateur: PublicUtilisateur;
  }> {
    const email = dto.email.toLowerCase().trim();

    const utilisateur = await this.utilisateurs.findOne({ where: { email } });
    if (!utilisateur) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      utilisateur.password,
    );
    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const access_token = await this.jwtService.signAsync({
      sub: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
    });

    this.logger.log(`[login] ${utilisateur.id}`);

    return { access_token, utilisateur: this.toPublic(utilisateur) };
  }

  logout(user: AuthenticatedUser): { message: string } {
    this.logger.log(`[logout] ${user.id}`);
    return { message: 'Déconnexion réussie' };
  }

  async me(user: AuthenticatedUser): Promise<PublicUtilisateur> {
    const utilisateur = await this.utilisateurs.findOne({
      where: { id: user.id },
    });

    if (!utilisateur) {
      throw new UnauthorizedException('Utilisateur introuvable');
    }

    return this.toPublic(utilisateur);
  }

  async forgotPassword(rawEmail: string) {
    const email = rawEmail.toLowerCase().trim();

    // Réponse identique quel que soit le résultat (anti-énumération)
    const genericResponse = {
      message:
        'Si un compte est associé à cette adresse, un email de réinitialisation a été envoyé. Pensez à vérifier vos courriers indésirables.',
    };

    const utilisateur = await this.utilisateurs.findOne({ where: { email } });

    if (!utilisateur) {
      this.logger.log(
        `[forgot-password] email inexistant (${email}) → réponse générique`,
      );
      await new Promise((resolve) => setTimeout(resolve, 400));
      return genericResponse;
    }

    // Invalider les anciens tokens non utilisés
    await this.resetTokens.update({ email, used: false }, { used: true });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);

    await this.resetTokens.save(
      this.resetTokens.create({
        email,
        tokenHash,
        expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        utilisateurId: utilisateur.id,
      }),
    );

    const resetUrl = this.mailService.buildResetUrl(rawToken);

    try {
      await this.mailService.sendPasswordResetEmail(email, resetUrl);
    } catch (error) {
      this.logger.error(`Erreur envoi email reset pour ${email}`, error);
    }

    if (process.env.NODE_ENV !== 'production') {
      return {
        ...genericResponse,
        _devToken: rawToken,
        _devResetUrl: resetUrl,
      };
    }

    return genericResponse;
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Les mots de passe ne correspondent pas');
    }

    if (newPassword.length < 8) {
      throw new BadRequestException(
        'Le mot de passe doit contenir au moins 8 caractères',
      );
    }

    const stored = await this.resetTokens.findOne({
      where: { tokenHash: this.hashToken(token) },
    });

    if (!stored) {
      throw new BadRequestException('Le lien de réinitialisation est invalide');
    }

    if (stored.used) {
      throw new BadRequestException('Ce lien a déjà été utilisé');
    }

    if (stored.expiresAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'Le lien de réinitialisation a expiré. Veuillez refaire une demande.',
      );
    }

    const utilisateur = await this.utilisateurs.findOne({
      where: { email: stored.email },
    });

    if (!utilisateur) {
      throw new BadRequestException('Utilisateur associé introuvable');
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    // Transaction : mot de passe + invalidation de TOUS les tokens
    await this.resetTokens.manager.transaction(async (manager) => {
      await manager.update(
        Utilisateur,
        { id: utilisateur.id },
        { password: hashedPassword },
      );

      await manager.update(
        PasswordResetToken,
        { email: stored.email, used: false },
        { used: true },
      );
    });

    this.logger.log(
      `[reset-password] Mot de passe réinitialisé (${stored.email})`,
    );

    return {
      message:
        'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    };
  }

  /** Purge des tokens expirés — appelée par la tâche planifiée du module. */
  async purgeExpiredResetTokens(): Promise<number> {
    const result = await this.resetTokens
      .createQueryBuilder()
      .delete()
      .where('"expiresAt" < :now', { now: new Date() })
      .orWhere('"used" = true AND "expiresAt" < :now', { now: new Date() })
      .execute();

    return result.affected ?? 0;
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
