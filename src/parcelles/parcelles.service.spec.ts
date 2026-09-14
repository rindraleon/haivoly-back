import { Test, TestingModule } from '@nestjs/testing';
import { ParcellesService } from './parcelles.service';

describe('ParcellesService', () => {
  let service: ParcellesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ParcellesService],
    }).compile();

    service = module.get<ParcellesService>(ParcellesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
