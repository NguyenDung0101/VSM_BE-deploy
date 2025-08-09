// src/images/images.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { ImageService } from './image.service';
import { Image } from '@prisma/client';

@Controller('images')
export class ImageController {
  constructor(private readonly imagesService: ImageService) {}

  @Get()
  async getImages(@Query('type') type?: string): Promise<Image[]> {
    return this.imagesService.getImages(type);
  }
}