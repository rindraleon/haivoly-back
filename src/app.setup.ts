/**
 * Configuration commune de l'application.
 *
 * `main.ts` (exécution réelle) et les tests e2e appelaient jusqu'ici chacun leur
 * propre configuration : les deux copies avaient **divergé** (le pipe de
 * validation des tests n'appliquait plus l'indexation des champs, le filtre
 * d'erreurs manquait dans un test), si bien qu'un test vert ne garantissait plus
 * le comportement en production.
 *
 * Toute la configuration est désormais ici, en un seul endroit : un test e2e
 * démarre exactement la même application que celle servie aux utilisateurs.
 */
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { mkdirSync } from 'fs';
import { join } from 'path';

import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ErrorCode } from './common/errors/error-codes';
import {
  champsInvalides,
  MESSAGE_VALIDATION,
} from './common/validation/validation-errors';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';

/** Dossiers d'images servis en statique. */
export const DOSSIERS_UPLOAD = ['observations', 'interventions', 'recoltes'];

/**
 * Applique à l'application toutes les règles transverses du backend :
 * CORS, validation stricte indexée, filtre d'erreur normalisé, interception
 * des réponses, dossiers d'upload servis en statique.
 */
export function configurerApplication(app: NestExpressApplication): void {
  const config = app.get(ConfigService);

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);

  // ── CORS ────────────────────────────────────────────────────
  const origins = config.get<string>('CORS_ORIGINS');
  app.enableCors({
    origin: origins ? origins.split(',').map((origin) => origin.trim()) : true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  });

  // ── Validation globale stricte ──────────────────────────────
  // Le statut reste **400** (contrat historique) mais la charge utile porte un
  // `code` stable et la liste **indexée** des champs fautifs, que le mobile
  // rattache au bon champ de formulaire (`pointsGPS.1.latitude` → deuxième
  // point, latitude).
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
      exceptionFactory: (erreurs) => {
        const fields = champsInvalides(erreurs);
        return new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: MESSAGE_VALIDATION,
          fields,
        });
      },
    }),
  );

  // ── Filtres & intercepteurs globaux ─────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformResponseInterceptor(),
  );

  // ── Fichiers uploadés (photos) ──────────────────────────────
  for (const dossier of DOSSIERS_UPLOAD) {
    mkdirSync(join(process.cwd(), 'uploads', dossier), { recursive: true });
  }
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });
}

/** Message de démarrage (journalisé une seule fois). */
export function journaliserDemarrage(port: number, env: string): void {
  new Logger('Bootstrap').log(
    `Haivoly backend prêt sur http://0.0.0.0:${port} (env: ${env})`,
  );
}
