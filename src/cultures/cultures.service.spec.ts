import { Test, TestingModule } from '@nestjs/testing';
import { CulturesService } from './cultures.service';

describe('CulturesService', () => {
  let service: CulturesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CulturesService],
    }).compile();

    service = module.get<CulturesService>(CulturesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
