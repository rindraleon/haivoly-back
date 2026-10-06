/**
 * Charge les variables d'environnement pour les tests e2e.
 * `DATABASE_URL_TEST` doit pointer vers une base dédiée (ne jamais exécuter
 * les tests e2e sur la base de production).
 */
import { config } from 'dotenv';

config();

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
