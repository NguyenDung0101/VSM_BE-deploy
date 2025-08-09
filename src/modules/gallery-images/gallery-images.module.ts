import { Module } from '@nestjs/common';
import { GalleryImagesService } from './gallery-images.service';
import { GalleryImagesController } from './gallery-images.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';

@Module({
  imports: [PrismaModule, UploadModule],
  controllers: [GalleryImagesController],
  providers: [GalleryImagesService],
  exports: [GalleryImagesService],
})
export class GalleryImagesModule {} 