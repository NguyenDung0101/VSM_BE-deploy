import { Test, TestingModule } from '@nestjs/testing';
import { EventRegistrationsService } from './event-registrations.service';

describe('EventRegistrationsService', () => {
  let service: EventRegistrationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventRegistrationsService],
    }).compile();

    service = module.get<EventRegistrationsService>(EventRegistrationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
