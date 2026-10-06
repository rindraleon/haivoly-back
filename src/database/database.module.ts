import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

import { buildDataSourceOptions } from './data-source';

/**
 * Point d'entrée unique de la base de données.
 * Aucun autre module ne doit instancier de DataSource / Repository "à la main".
 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const options = buildDataSourceOptions({
          ...process.env,
          DATABASE_URL:
            config.get<string>('DATABASE_URL') ?? process.env.DATABASE_URL,
          DATABASE_SSL: config.get<string>('DATABASE_SSL'),
          DATABASE_POOL_MAX: config.get<string>('DATABASE_POOL_MAX'),
          TYPEORM_LOGGING: config.get<string>('TYPEORM_LOGGING'),
        });

        return {
          ...options,
          // `false` en production : le schéma est piloté par les migrations.
          // `DB_SYNCHRONIZE=true` reste possible pour un environnement jetable.
          synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        };
      },
      dataSourceFactory: async (options) => {
        const dataSource = new DataSource(options!);
        return dataSource.initialize();
      },
    }),
  ],
})
export class DatabaseModule {}
