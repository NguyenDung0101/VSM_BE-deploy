import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Logger } from '@nestjs/common';
import { HomepagesService } from './homepages.service';
import { CreateHomepageDto } from './dto/create-homepage.dto';
import { UpdateHomepageDto } from './dto/update-homepage.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('homepages')
export class HomepagesController {
  private readonly logger = new Logger(HomepagesController.name);
  
  constructor(private readonly homepagesService: HomepagesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createHomepageDto: CreateHomepageDto) {
    this.logger.debug(`Received create request with data: ${JSON.stringify(createHomepageDto)}`);
    return this.homepagesService.create(createHomepageDto);
  }

  @Get()
  findAll() {
    return this.homepagesService.findAll();
  }

  @Get('default')
  getDefault() {
    return this.homepagesService.getDefault();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.homepagesService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateHomepageDto: UpdateHomepageDto) {
    return this.homepagesService.update(id, updateHomepageDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.homepagesService.remove(id);
  }
} 