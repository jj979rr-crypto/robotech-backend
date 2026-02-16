import { Test, TestingModule } from '@nestjs/testing';
import { ReniecController } from './reniec.controller';
import { ReniecService } from './reniec.service';

describe('ReniecController', () => {
  let controller: ReniecController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReniecController],
      providers: [ReniecService],
    }).compile();

    controller = module.get<ReniecController>(ReniecController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
