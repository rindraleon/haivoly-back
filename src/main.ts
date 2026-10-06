import 'reflect-metadata';

// Doit précéder toute création de connexion (lecture UTC des dates).
import './database/pg-types';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';

import { AppModule } from './app.module';
import { configurerApplication, journaliserDemarrage } from './app.setup';

/**
 * Point d'entrée : SEULE responsabilité, démarrer le serveur.
 * Toute la configuration (CORS, validation, filtres, statique) est définie
 * dans `app.setup.ts`, partagée avec les tests e2e.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });

  configurerApplication(app);

  const config = app.get(ConfigService);
  const port = Number(config.get<string>('PORT') ?? 3000);

  await app.listen(port, '0.0.0.0');
  journaliserDemarrage(port, config.get<string>('NODE_ENV') ?? 'development');
}

void bootstrap();
