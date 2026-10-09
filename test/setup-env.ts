import { config } from 'dotenv';

config();

if (process.env.DATABASE_URL_TEST) {
  process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
}

process.env.NODE_ENV = process.env.NODE_ENV ?? 'test';
