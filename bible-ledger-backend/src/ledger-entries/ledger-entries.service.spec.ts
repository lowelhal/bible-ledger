import { Test, TestingModule } from '@nestjs/testing';
import { LedgerEntriesService } from './ledger-entries.service';

describe('LedgerEntriesService', () => {
  let service: LedgerEntriesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LedgerEntriesService],
    }).compile();

    service = module.get<LedgerEntriesService>(LedgerEntriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
