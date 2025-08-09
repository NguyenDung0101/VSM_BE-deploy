import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HomepageSectionsController } from './homepage-sections.controller';
import { HomepageSectionsService } from './homepage-sections.service';

@Module({
  imports: [PrismaModule],
  controllers: [HomepageSectionsController],
  providers: [HomepageSectionsService],
  exports: [HomepageSectionsService],
})
export class HomepageModule {}