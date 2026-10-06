import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import type { Server } from 'http';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { AllExceptionsFilter } from '../src/common/filters/all-exceptions.filter';
import { TransformResponseInterceptor } from '../src/common/interceptors/transform-response.interceptor';

/**
 * Tests e2e — nécessitent une base PostgreSQL accessible via DATABASE_URL
 * (voir .env.example → DATABASE_URL_TEST).
 */
describe('Parcours complet API (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let parcelleId: string;
  let cultureId: string;

  const email = `e2e-${Date.now()}@haivoly.mg`;
  const password = 'MotDePasse123';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformResponseInterceptor());

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer() as Server);

  it('POST /auth/register crée un compte sans exposer le mot de passe', async () => {
    const res = await api()
      .post('/auth/register')
      .send({ nom: 'E2E', prenom: 'Test', email, password })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(email);
    expect(res.body.data.password).toBeUndefined();
  });

  it('POST /auth/login délivre un JWT', async () => {
    const res = await api()
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    token = res.body.data.access_token;
    expect(typeof token).toBe('string');
  });

  it('GET /parcelles est protégé', async () => {
    await api().get('/parcelles').expect(401);
  });

  it('POST /parcelles crée une parcelle pour l’utilisateur connecté', async () => {
    const res = await api()
      .post('/parcelles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Parcelle e2e',
        latitude: -18.8792,
        longitude: 47.5079,
        pointsGPS: [
          { latitude: -18.8792, longitude: 47.5079, ordre: 0 },
          { latitude: -18.8795, longitude: 47.5085, ordre: 1 },
          { latitude: -18.8799, longitude: 47.5082, ordre: 2 },
        ],
      })
      .expect(201);

    parcelleId = res.body.data.id;
    expect(res.body.data.pointsGPS).toHaveLength(3);
    expect(res.body.data.superficie).toBeGreaterThan(0);
  });

  it('POST /parcelles/:id/cultures crée une culture (dates YYYY-MM-DD)', async () => {
    const res = await api()
      .post(`/parcelles/${parcelleId}/cultures`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Riz e2e',
        datePlantation: '2026-01-15',
        datePrevueRecolte: '2026-05-20',
        statut: 'EN_COURS',
      })
      .expect(201);

    cultureId = res.body.data.id;
    expect(res.body.data.statut).toBe('EN_COURS');
  });

  it('une date métier refusant un instant ISO (contrat AAAA-MM-JJ)', async () => {
    const res = await api()
      .post(`/parcelles/${parcelleId}/cultures`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Décalage horaire',
        datePlantation: '2026-05-18T00:00:00.000Z',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(JSON.stringify(res.body)).toContain('AAAA-MM-JJ');
  });

  it('une date d’intervention refusant une date calendaire seule', async () => {
    const res = await api()
      .post(`/cultures/${cultureId}/interventions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ type: 'AUTRE', date: '2026-05-18' })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('le statut d’une intervention est calculé par le backend', async () => {
    const future = await api()
      .post(`/cultures/${cultureId}/interventions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'IRRIGATION',
        date: '2027-01-01T06:00:00.000Z',
      })
      .expect(201);

    expect(future.body.data.statut).toBe('PLANIFIEE');

    const past = await api()
      .post(`/cultures/${cultureId}/interventions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'FERTILISATION',
        date: '2026-02-01T06:00:00.000Z',
      })
      .expect(201);

    expect(past.body.data.statut).toBe('EN_COURS');
  });

  it('un client ne peut pas imposer un statut d’intervention', async () => {
    const res = await api()
      .post(`/cultures/${cultureId}/interventions`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'AUTRE',
        date: '2027-01-01T06:00:00.000Z',
        statut: 'EN_COURS',
      })
      .expect(400);

    expect(res.body.success).toBe(false);
  });

  it('créer une récolte passe la culture en RECOLTEE (règle transactionnelle)', async () => {
    await api()
      .post(`/cultures/${cultureId}/recolte`)
      .set('Authorization', `Bearer ${token}`)
      .send({ dateRecolte: '2026-05-18', quantite: 1200, unite: 'kg' })
      .expect(201);

    const res = await api()
      .get(`/cultures/${cultureId}/recolte`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.data.quantite).toBe(1200);

    const culture = await api()
      .get(`/parcelles/${parcelleId}/cultures/${cultureId}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(culture.body.data.statut).toBe('RECOLTEE');
  });

  it('la synchronisation est idempotente', async () => {
    const clientId = `e2e-${Date.now()}`;
    const body = {
      deviceId: 'e2e-device',
      actions: [
        {
          clientId,
          actionType: 'CREATE',
          entityType: 'PARCELLE',
          payload: { nom: 'Parcelle hors ligne e2e' },
        },
      ],
    };

    const first = await api()
      .post('/sync')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);

    expect(first.body.data.results[0].status).toBe('SYNCED');

    const second = await api()
      .post('/sync')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(201);

    expect(second.body.data.results[0].status).toBe('DUPLICATE');

    const list = await api()
      .get('/parcelles?limit=200')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const created = list.body.data.items.filter(
      (p: { nom: string }) => p.nom === 'Parcelle hors ligne e2e',
    );

    expect(created).toHaveLength(1);
  });

  it('un utilisateur ne peut pas lire les données d’un autre (ownership)', async () => {
    const otherEmail = `e2e-other-${Date.now()}@haivoly.mg`;

    await api()
      .post('/auth/register')
      .send({ nom: 'Autre', email: otherEmail, password })
      .expect(201);

    const login = await api()
      .post('/auth/login')
      .send({ email: otherEmail, password })
      .expect(201);

    await api()
      .get(`/parcelles/${parcelleId}`)
      .set('Authorization', `Bearer ${login.body.data.access_token}`)
      .expect(404);
  });
});
