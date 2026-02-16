import { Test, TestingModule } from '@nestjs/testing';
import { ReniecService } from './reniec.service';

describe('ReniecService', () => {
  let service: ReniecService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ReniecService],
    }).compile();

    service = module.get<ReniecService>(ReniecService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
