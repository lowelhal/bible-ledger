import { Test, TestingModule } from '@nestjs/testing';
import { LedgerEntriesController } from './ledger-entries.controller';

describe('LedgerEntriesController', () => {
  let controller: LedgerEntriesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LedgerEntriesController],
    }).compile();

    controller = module.get<LedgerEntriesController>(LedgerEntriesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
