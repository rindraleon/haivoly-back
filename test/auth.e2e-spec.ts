import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configurerApplication } from '../src/app.setup';

describe('Parcours complet API (e2e)', () => {
  let app: NestExpressApplication;
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
    // Même configuration que le serveur réel : un test vert décrit bien le
    // comportement observé par l'utilisateur.
    configurerApplication(app);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const api = () => request(app.getHttpServer());

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
    // Une connexion n'est pas une création de ressource : 200 et non 201.
    const res = await api()
      .post('/auth/login')
      .send({ email, password })
      .expect(200);

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
      .expect(200);

    expect(first.body.data.results[0].status).toBe('SYNCED');

    const second = await api()
      .post('/sync')
      .set('Authorization', `Bearer ${token}`)
      .send(body)
      .expect(200);

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

  it('renvoie un contrat d’erreur normalisé et indexé', async () => {
    // Champ indexé au cœur d'un tableau : le mobile doit pouvoir rattacher
    // l'erreur au BON élément du formulaire.
    const invalide = await api()
      .post('/parcelles')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Parcelle invalide e2e',
        pointsGPS: [
          { latitude: 'nord', longitude: 47.5 },
          { latitude: -18.9, longitude: 47.5 },
        ],
      })
      .expect(400);

    expect(invalide.body.success).toBe(false);
    expect(invalide.body.code).toBe('VALIDATION_ERROR');
    expect(invalide.body.errorCode).toBe('VALIDATION_ERROR');
    expect(invalide.body.path).toBe('/parcelles');

    const champ = invalide.body.fields[0] as {
      field: string;
      path: (string | number)[];
      code: string;
      message: string;
    };

    expect(champ.field).toBe('pointsGPS.0.latitude');
    expect(champ.path).toEqual(['pointsGPS', 0, 'latitude']);
    expect(champ.code).toBe('VALIDATION_INVALID_FORMAT');
    // Message français destiné à l'utilisateur, jamais le défaut anglais.
    expect(champ.message).toMatch(/Latitude invalide/);
    expect(champ.message).not.toMatch(/must be|should be/);

    // Champ inconnu : code dédié, refusé par la liste blanche.
    const inconnu = await api()
      .post('/parcelles')
      .set('Authorization', `Bearer ${token}`)
      .send({ nom: 'Parcelle e2e', champInconnu: 1 })
      .expect(400);

    expect(
      (inconnu.body.fields as { field: string; code: string }[]).some(
        (f) =>
          f.field === 'champInconnu' && f.code === 'VALIDATION_UNKNOWN_FIELD',
      ),
    ).toBe(true);
  });

  it('distingue « non authentifié » de « identifiants invalides »', async () => {
    const sansJeton = await api().get('/parcelles').expect(401);
    expect(sansJeton.body.code).toBe('AUTH_UNAUTHORIZED');
    expect(sansJeton.body.message).toMatch(/connecté/i);

    const mauvaisMotDePasse = await api()
      .post('/auth/login')
      .send({ email, password: 'mauvais-mot-de-passe' })
      .expect(401);
    expect(mauvaisMotDePasse.body.code).toBe('AUTH_INVALID_CREDENTIALS');
    expect(mauvaisMotDePasse.body.message).not.toMatch(/Internal|stack/i);
  });

  it('renvoie 404 — et non 403 — pour la ressource d’un autre utilisateur', async () => {
    const res = await api()
      .get(`/parcelles/${parcelleId}`)
      .set('Authorization', 'Bearer jeton.totalement.invalide')
      .expect(401);

    expect(res.body.code).toBe('AUTH_UNAUTHORIZED');
    expect(res.body.message).not.toMatch(/JsonWebToken|jwt/i);
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
      .expect(200);

    await api()
      .get(`/parcelles/${parcelleId}`)
      .set('Authorization', `Bearer ${login.body.data.access_token}`)
      .expect(404);
  });
});
