import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHomepageDto } from './dto/create-homepage.dto';
import { UpdateHomepageDto } from './dto/update-homepage.dto';

@Injectable()
export class HomepagesService {
  constructor(private prisma: PrismaService) {}

  async create(createHomepageDto: CreateHomepageDto) {
    try {
      const { name } = createHomepageDto;
      return await this.prisma.homepage.create({
        data: {
          name: name,
        },
      });
    } catch (error) {
      console.error('Error creating homepage:', error);
      throw error;
    }
  }

  async findAll() {
    return this.prisma.homepage.findMany({
      include: {
        sections: true,
      },
    });
  }

  async findOne(id: string) {
    const homepage = await this.prisma.homepage.findUnique({
      where: { id },
      include: {
        sections: {
          include: {
            hero: true,
            about: true,
            events: true,
            news: true,
            team: true,
            gallery: true,
            cta: true,
            aboutFeatures: true,
            countdown: true,
            story: true,
            stats: true,
          },
          orderBy: { order: 'asc' },
        },
      },
    });

    if (!homepage) {
      throw new NotFoundException(`Homepage with ID ${id} not found`);
    }

    return homepage;
  }

  async update(id: string, updateHomepageDto: UpdateHomepageDto) {
    const homepage = await this.prisma.homepage.findUnique({
      where: { id },
    });

    if (!homepage) { // Kiểm tra xem homepage có tồn tại không
      throw new NotFoundException(`Homepage with ID ${id} not found`);
    }

    return this.prisma.homepage.update({
      where: { id },
      data: updateHomepageDto,
    });
  }

  async remove(id: string) {
    const homepage = await this.prisma.homepage.findUnique({
      where: { id },
    });

    if (!homepage) {
      throw new NotFoundException(`Homepage with ID ${id} not found`);
    }

    return this.prisma.homepage.delete({
      where: { id },
    });
  }

  async getDefault() {
    // Get the first homepage or create a default one if none exists
    const homepage = await this.prisma.homepage.findFirst();
    
    if (homepage) {
      return homepage;
    }

    // Create a default homepage
    return this.prisma.homepage.create({
      data: {
        name: 'Default Homepage',
      },
    });
  }
} 