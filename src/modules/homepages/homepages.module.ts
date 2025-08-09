import { Module } from '@nestjs/common';
import { HomepagesService } from './homepages.service';
import { HomepagesController } from './homepages.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HomepagesController],
  providers: [HomepagesService],
  exports: [HomepagesService],
})
export class HomepagesModule {} 