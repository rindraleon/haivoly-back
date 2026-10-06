import 'reflect-metadata';

// Doit précéder toute création de connexion (lecture UTC des dates).
import './database/pg-types';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { mkdirSync } from 'fs';

import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { requestIdMiddleware } from './common/middleware/request-id.middleware';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });

  const config = app.get(ConfigService);
  const port = Number(config.get<string>('PORT') ?? 3000);

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
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // ── Filtres & intercepteurs globaux ─────────────────────────
  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformResponseInterceptor(),
  );

  // ── Fichiers uploadés (photos) ──────────────────────────────
  for (const folder of ['observations', 'interventions', 'recoltes']) {
    mkdirSync(join(process.cwd(), 'uploads', folder), { recursive: true });
  }
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads/' });

  await app.listen(port, '0.0.0.0');

  new Logger('Bootstrap').log(
    `Haivoly backend prêt sur http://0.0.0.0:${port} (env: ${config.get('NODE_ENV') ?? 'development'})`,
  );
}

void bootstrap();
