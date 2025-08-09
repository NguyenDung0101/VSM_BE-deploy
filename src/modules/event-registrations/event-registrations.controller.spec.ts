import { Test, TestingModule } from '@nestjs/testing';
import { EventRegistrationsController } from './event-registrations.controller';

describe('EventRegistrationsController', () => {
  let controller: EventRegistrationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventRegistrationsController],
    }).compile();

    controller = module.get<EventRegistrationsController>(EventRegistrationsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
