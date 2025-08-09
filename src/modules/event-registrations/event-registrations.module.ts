import { Module } from '@nestjs/common';
import { EventRegistrationsService } from './event-registrations.service';
import { EventRegistrationsController } from './event-registrations.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EventRegistrationsController],
  providers: [EventRegistrationsService],
  exports: [EventRegistrationsService],
})
export class EventRegistrationsModule {}
