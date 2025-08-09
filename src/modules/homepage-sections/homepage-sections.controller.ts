// src/homepage-sections/homepage-sections.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  UseGuards, 
  UploadedFile, 
  UseInterceptors
} from '@nestjs/common';
import { HomepageSectionsService } from './homepage-sections.service';
import { HomepageSection } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Giả sử bạn có guard để bảo vệ API
import { FileInterceptor } from '@nestjs/platform-express';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('homepage-sections')
export class HomepageSectionsController {
  constructor(private readonly homepageSectionsService: HomepageSectionsService) {}

  @Get()
  async getAllSections(): Promise<HomepageSection[]> {
    return this.homepageSectionsService.getAllSections();
  }

  @UseGuards(JwtAuthGuard)
  @Post()
  async createSection(@Body() data: {
    name?: string;
    component?: string;
    enabled: boolean;
    order: number;
    authorId?: string;
    type: string;
    homepageId?: string; // Để tùy chọn, có thể sử dụng homepage mặc định
    sectionData?: any;
  }): Promise<HomepageSection> {
    return this.homepageSectionsService.createSection(data);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  async updateSection(@Param('id') id: string, @Body() data: {
    name?: string;
    component?: string;
    enabled?: boolean;
    order?: number;
    sectionData?: any;
  }): Promise<HomepageSection> {
    return this.homepageSectionsService.updateSection(id, data);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  async deleteSection(@Param('id') id: string): Promise<HomepageSection> {
    return this.homepageSectionsService.deleteSection(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reorder')
  async reorderSections(@Body() sections: { id: string; order: number }[]): Promise<void> {
    return this.homepageSectionsService.reorderSections(sections);
  }

  @Get('hero')
  async getHeroSection(): Promise<HomepageSection | null> {
    return this.homepageSectionsService.getHeroSection();
  }

  @UseGuards(JwtAuthGuard)
  @Put('hero')
  async updateHeroSection(@Body() data: any): Promise<HomepageSection | null> {
    return this.homepageSectionsService.updateHeroSection(data);
  }

  @Get('types/:type')
  async getSectionsByType(@Param('type') type: string): Promise<HomepageSection[]> {
    return this.homepageSectionsService.getSectionsByType(type);
  }

  @Post(':id/upload-hero-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseInterceptors(FileInterceptor('file'))
  async uploadHeroImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<HomepageSection> {
    return this.homepageSectionsService.uploadHeroImage(id, file);
  }

  @Post(':id/upload-story-image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseInterceptors(FileInterceptor('file'))
  async uploadStoryImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<HomepageSection> {
    return this.homepageSectionsService.uploadStoryImage(id, file);
  }
}