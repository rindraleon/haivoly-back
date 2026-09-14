import { Test, TestingModule } from '@nestjs/testing';
import { ParcellesController } from './parcelles.controller';

describe('ParcellesController', () => {
  let controller: ParcellesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ParcellesController],
    }).compile();

    controller = module.get<ParcellesController>(ParcellesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
