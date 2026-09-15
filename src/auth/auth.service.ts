import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  // =========================
  // REGISTER
  // =========================
  async register(registerDto: RegisterDto) {
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: registerDto.nom,
        prenom: registerDto.prenom,
        email: registerDto.email,
        telephone: registerDto.telephone,
        password: hashedPassword,
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...result } = utilisateur;
    return result;
  }

  // =========================
  // LOGIN
  // =========================
  async login(loginDto: LoginDto) {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: loginDto.email },
    });

    if (!utilisateur) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const passwordValid = await bcrypt.compare(
      loginDto.password,
      utilisateur.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect');
    }

    const payload = {
      sub: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
    };

    const access_token = await this.jwtService.signAsync(payload);

    return {
      access_token,
      utilisateur: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        telephone: utilisateur.telephone,
        role: utilisateur.role,
      },
    };
  }

  // =========================
  // FORGOT PASSWORD
  // =========================
  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();

    // Toujours retourner le même message pour éviter l'énumération
    const genericResponse = {
      message:
        'Si un compte est associé à cette adresse, un email de réinitialisation a été envoyé. Pensez à vérifier vos courriers indésirables.',
    };

    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: normalizedEmail },
    });

    // Ne pas révéler si l'email existe
    if (!utilisateur) {
      this.logger.log(
        `[forgot-password] Demande pour email inexistant: ${normalizedEmail} (réponse générique)`,
      );
      // Simuler un délai pour éviter le timing attack
      await new Promise((r) => setTimeout(r, 400));
      return genericResponse;
    }

    // Invalider les anciens tokens non utilisés de cet email
    await this.prisma.passwordResetToken.updateMany({
      where: { email: normalizedEmail, used: false },
      data: { used: true },
    });

    // Générer un token sécurisé (32 bytes = 64 chars hex)
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 60 minutes

    await this.prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        tokenHash,
        expiresAt,
        utilisateurId: utilisateur.id,
      },
    });

    const resetUrl = this.mailService.buildResetUrl(rawToken);

    try {
      await this.mailService.sendPasswordResetEmail(normalizedEmail, resetUrl);
    } catch (error) {
      this.logger.error(
        `Erreur envoi email reset pour ${normalizedEmail}`,
        error,
      );
      // Ne pas exposer l'erreur à l'utilisateur
    }

    this.logger.log(
      `[forgot-password] Token généré pour ${normalizedEmail} - expire à ${expiresAt.toISOString()}`,
    );

    // En développement, exposer le token pour faciliter les tests (ne pas faire en prod)
    if (process.env.NODE_ENV !== 'production') {
      return {
        ...genericResponse,
        _devToken: rawToken,
        _devResetUrl: resetUrl,
      };
    }

    return genericResponse;
  }

  // =========================
  // RESET PASSWORD
  // =========================
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

    // Vérifier la robustesse minimalement (au moins une majuscule, une minuscule, un chiffre)
    // Optionnel mais recommandé UX - on laisse le backend permissif, frontend fera le reste

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const stored = await this.prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!stored) {
      throw new BadRequestException('Le lien de réinitialisation est invalide');
    }

    if (stored.used) {
      throw new BadRequestException('Ce lien a déjà été utilisé');
    }

    if (stored.expiresAt < new Date()) {
      throw new BadRequestException(
        'Le lien de réinitialisation a expiré. Veuillez refaire une demande.',
      );
    }

    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { email: stored.email },
    });

    if (!utilisateur) {
      throw new BadRequestException('Utilisateur associé introuvable');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe + invalider le token en transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.utilisateur.update({
        where: { id: utilisateur.id },
        data: { password: hashedPassword },
      });

      await tx.passwordResetToken.update({
        where: { id: stored.id },
        data: { used: true },
      });

      // Invalider tous les autres tokens de cet utilisateur
      await tx.passwordResetToken.updateMany({
        where: { email: stored.email, used: false },
        data: { used: true },
      });
    });

    this.logger.log(
      `[reset-password] Mot de passe réinitialisé pour ${stored.email}`,
    );

    return {
      message:
        'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    };
  }
}
