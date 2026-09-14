import { Test, TestingModule } from '@nestjs/testing';
import { CulturesController } from './cultures.controller';

describe('CulturesController', () => {
  let controller: CulturesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CulturesController],
    }).compile();

    controller = module.get<CulturesController>(CulturesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
