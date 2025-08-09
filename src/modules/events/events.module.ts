import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { UploadModule } from 'src/modules/upload/upload.module';

@Module({
  imports: [UploadModule],
  controllers: [EventsController],
  providers: [EventsService]
})
export class EventsModule {}
