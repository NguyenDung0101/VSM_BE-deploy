// src/homepage-sections/homepage-sections.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HomepageSection, Prisma } from '@prisma/client';
import { HomepagesService } from '../homepages/homepages.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class HomepageSectionsService {
  constructor(
    private prisma: PrismaService,
    private homepagesService: HomepagesService,
    private uploadService: UploadService
  ) {}

  async getAllSections(): Promise<HomepageSection[]> {
    return this.prisma.homepageSection.findMany({
      orderBy: { order: 'asc' },
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
    });
  }

  async createSection(data: {
    name?: string;
    component?: string;
    enabled: boolean;
    order: number;
    authorId?: string;
    type: string;
    homepageId?: string;
    sectionData?: any;
  }): Promise<HomepageSection> {
    const { sectionData, component, homepageId, ...sectionFields } = data;
    
    // Nếu không có homepageId, lấy hoặc tạo homepage mặc định
    let actualHomepageId = homepageId;
    if (!actualHomepageId) {
      const defaultHomepage = await this.homepagesService.getDefault();
      actualHomepageId = defaultHomepage.id;
    }
    
    // Create the base section
    const section = await this.prisma.homepageSection.create({
      data: {
        ...sectionFields,
        homepageId: actualHomepageId,
      },
    });

    // Create the specific section type data
    if (sectionData) {
      await this.createSectionDetails(section.id, section.type, sectionData);
    }

    return this.getSection(section.id);
  }

  async updateSection(id: string, data: {
    name?: string;
    component?: string;
    enabled?: boolean;
    order?: number;
    sectionData?: any;
  }): Promise<HomepageSection> {
    const { sectionData, component, ...sectionFields } = data;
    
    // Get the current section to check its type
    const currentSection = await this.prisma.homepageSection.findUnique({
      where: { id },
    });

    // Update the base section
    if (!currentSection) {
      throw new Error(`Section with ID ${id} not found`);
    }

    await this.prisma.homepageSection.update({
      where: { id },
      data: sectionFields,
    });

    // Update the specific section type data
    if (sectionData) {
      await this.updateSectionDetails(id, currentSection.type, sectionData);
    }

    return this.getSection(id);
  }

  async deleteSection(id: string): Promise<HomepageSection> {
    // Cascade delete will handle the specific section type data
    return this.prisma.homepageSection.delete({
      where: { id },
    });
  }

  async reorderSections(sections: { id: string; order: number }[]): Promise<void> {
    const updates = sections.map(({ id, order }) =>
      this.prisma.homepageSection.update({
        where: { id },
        data: { order },
      })
    );
    await Promise.all(updates);
  }

  async getSection(id: string): Promise<HomepageSection> {
    const section = await this.prisma.homepageSection.findUnique({
      where: { id },
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
    });
    
    if (!section) {
      throw new Error(`Section with ID ${id} not found`);
    }
    
    return section;
  }

  async getHeroSection(): Promise<HomepageSection | null> {
    return this.prisma.homepageSection.findFirst({
      where: { type: 'HeroSection' },
      orderBy: { order: 'asc' },
      include: {
        hero: true,
      }
    });
  }

  async updateHeroSection(config: any): Promise<HomepageSection | null> {
    const hero = await this.prisma.homepageSection.findFirst({
      where: { type: 'HeroSection' },
      orderBy: { order: 'asc' },
    });
    if (!hero) return null;

    return this.updateSection(hero.id, { sectionData: config });
  }

  async getSectionsByType(type: string): Promise<HomepageSection[]> {
    const includeObj: any = {};
    const typeToRelationMap: Record<string, string> = {
      'HeroSection': 'hero',
      'AboutSection': 'about',
      'EventsSection': 'events',
      'NewsSection': 'news',
      'TeamSection': 'team',
      'GallerySection': 'gallery',
      'CTASection': 'cta',
      'AboutFeatures': 'aboutFeatures',
      'CountdownTimer': 'countdown',
      'SportsCommunityStory': 'story',
      'Stats': 'stats',
    };

    const relationName = typeToRelationMap[type];
    if (relationName) {
      includeObj[relationName] = true;
    }

    return this.prisma.homepageSection.findMany({
      where: { type },
      orderBy: { order: 'asc' },
      include: includeObj,
    });
  }

  async uploadHeroImage(sectionId: string, file: Express.Multer.File): Promise<HomepageSection> {
    // Verify the section exists and is of type HeroSection
    const section = await this.prisma.homepageSection.findUnique({
      where: { id: sectionId },
      include: { hero: true },
    });

    if (!section || section.type !== 'HeroSection') {
      throw new Error('Section not found or not a HeroSection');
    }

    // Delete old image if exists
    if (section.hero?.backgroundImage) {
      try {
        await this.uploadService.deleteFile(section.hero.backgroundImage);
      } catch (error) {
        console.error('Failed to delete old hero image:', error);
      }
    }

    // Upload new image
    const imageUrl = await this.uploadService.saveFile(file, 'hero');

    // Update the hero section with new image
    await this.prisma.heroSection.update({
      where: { sectionId },
      data: { backgroundImage: imageUrl },
    });

    // Return the updated section
    return this.getSection(sectionId);
  }

  async uploadStoryImage(sectionId: string, file: Express.Multer.File): Promise<HomepageSection> {
    // Verify the section exists and is of type SportsCommunityStory
    const section = await this.prisma.homepageSection.findUnique({
      where: { id: sectionId },
      include: { story: true },
    });

    if (!section || section.type !== 'SportsCommunityStory') {
      throw new Error('Section not found or not a SportsCommunityStory');
    }

    // Delete old image if exists
    if (section.story?.image) {
      try {
        await this.uploadService.deleteFile(section.story.image);
      } catch (error) {
        console.error('Failed to delete old story image:', error);
      }
    }

    // Upload new image
    const imageUrl = await this.uploadService.saveFile(file, 'story');

    // Update the story section with new image
    await this.prisma.sportsCommunityStory.update({
      where: { sectionId },
      data: { image: imageUrl },
    });

    // Return the updated section
    return this.getSection(sectionId);
  }

  private async createSectionDetails(sectionId: string, type: string, data: any): Promise<void> {
    switch (type) {
      case 'HeroSection':
        await this.prisma.heroSection.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'AboutSection':
        await this.prisma.aboutSection.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'EventsSection':
        await this.prisma.eventsSection.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'NewsSection':
        await this.prisma.newsSection.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'TeamSection':
        await this.prisma.teamSection.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'GallerySection':
        await this.prisma.gallerySection.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'CTASection':
        await this.prisma.cTASection.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'AboutFeatures':
        await this.prisma.aboutFeatures.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'CountdownTimer':
        await this.prisma.countdownTimer.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'SportsCommunityStory':
        await this.prisma.sportsCommunityStory.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
      case 'Stats':
        await this.prisma.statsSection.create({
          data: {
            ...data,
            section: { connect: { id: sectionId } },
          },
        });
        break;
    }
  }

  private async updateSectionDetails(sectionId: string, type: string, data: any): Promise<void> {
    switch (type) {
      case 'HeroSection':
        await this.prisma.heroSection.update({
          where: { sectionId },
          data,
        });
        break;
      case 'AboutSection':
        await this.prisma.aboutSection.update({
          where: { sectionId },
          data,
        });
        break;
      case 'EventsSection':
        await this.prisma.eventsSection.update({
          where: { sectionId },
          data,
        });
        break;
      case 'NewsSection':
        await this.prisma.newsSection.update({
          where: { sectionId },
          data,
        });
        break;
      case 'TeamSection':
        await this.prisma.teamSection.update({
          where: { sectionId },
          data,
        });
        break;
      case 'GallerySection':
        await this.prisma.gallerySection.update({
          where: { sectionId },
          data,
        });
        break;
      case 'CTASection':
        await this.prisma.cTASection.update({
          where: { sectionId },
          data,
        });
        break;
      case 'AboutFeatures':
        await this.prisma.aboutFeatures.update({
          where: { sectionId },
          data,
        });
        break;
      case 'CountdownTimer':
        await this.prisma.countdownTimer.update({
          where: { sectionId },
          data,
        });
        break;
      case 'SportsCommunityStory':
        await this.prisma.sportsCommunityStory.update({
          where: { sectionId },
          data,
        });
        break;
      case 'Stats':
        await this.prisma.statsSection.update({
          where: { sectionId },
          data,
        });
        break;
    }
  }
}