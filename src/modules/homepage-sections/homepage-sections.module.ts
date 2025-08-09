// src/homepage-sections/homepage-sections.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HomepageSectionsController } from './homepage-sections.controller';
import { HomepageSectionsService } from './homepage-sections.service';
import { HomepagesModule } from '../homepages/homepages.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, HomepagesModule, UploadModule],
  controllers: [HomepageSectionsController],
  providers: [HomepageSectionsService],
  exports: [HomepageSectionsService],
})
export class HomepageSectionsModule {}