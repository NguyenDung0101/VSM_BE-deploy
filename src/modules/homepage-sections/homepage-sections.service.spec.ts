import { Test, TestingModule } from '@nestjs/testing';
import { HomepageSectionsService } from './homepage-sections.service';

describe('HomepageSectionsService', () => {
  let service: HomepageSectionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HomepageSectionsService],
    }).compile();

    service = module.get<HomepageSectionsService>(HomepageSectionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
