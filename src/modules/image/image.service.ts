// src/images/images.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Image } from '@prisma/client';

@Injectable()
export class ImageService {
  constructor(private prisma: PrismaService) {}

  async getImages(type?: string): Promise<Image[]> {
    return this.prisma.image.findMany({
      where: type ? { type } : undefined,
    });
  }
}