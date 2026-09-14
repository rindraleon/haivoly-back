import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  // =========================
  // REGISTER
  // =========================
  async register(registerDto: RegisterDto) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: {
        email: registerDto.email,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'Cet email est déjà utilisé',
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      10,
    );

    // Créer l'utilisateur
    const utilisateur = await this.prisma.utilisateur.create({
      data: {
        nom: registerDto.nom,
        prenom: registerDto.prenom,
        email: registerDto.email,
        telephone: registerDto.telephone,
        password: hashedPassword,
      },
    });

    // Ne jamais retourner le mot de passe
    const { password: _, ...result } = utilisateur;

    return result;
  }

  // =========================
  // LOGIN
  // =========================
  async login(loginDto: LoginDto) {
    // Chercher l'utilisateur
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: {
        email: loginDto.email,
      },
    });

    // Utilisateur inexistant
    if (!utilisateur) {
      throw new UnauthorizedException(
        'Email ou mot de passe incorrect',
      );
    }

    // Vérifier le mot de passe
    const passwordValid = await bcrypt.compare(
      loginDto.password,
      utilisateur.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException(
        'Email ou mot de passe incorrect',
      );
    }

    // Données stockées dans le JWT
    const payload = {
      sub: utilisateur.id,
      email: utilisateur.email,
      role: utilisateur.role,
    };

    // Générer le JWT
    const access_token =
      await this.jwtService.signAsync(payload);

    // Retourner le token et les informations utilisateur
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
}