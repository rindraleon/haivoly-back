import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../src/app.module';
import { configurerApplication } from '../src/app.setup';

describe('Application (e2e)', () => {
  let app: NestExpressApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestExpressApplication>();
    // Même configuration que le serveur réel.
    configurerApplication(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health expose l’état de la base de données', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ok');
    expect(res.body.data.database).toBe('up');
  });

  it('une route inconnue renvoie 404 sans exposer de stack trace', async () => {
    const res = await request(app.getHttpServer())
      .get('/route-inexistante')
      .expect(404);

    expect(JSON.stringify(res.body)).not.toContain('at ');
  });
});
