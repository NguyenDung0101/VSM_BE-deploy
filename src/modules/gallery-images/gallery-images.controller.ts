import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { GalleryImagesService } from './gallery-images.service';
import { CreateGalleryImageDto } from './dto/create-gallery-image.dto';
import { UpdateGalleryImageDto } from './dto/update-gallery-image.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, GalleryCategory } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody, ApiProperty } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';

// DTO mới cho việc upload ảnh không yêu cầu src
class UploadGalleryImageDto {
  @ApiProperty({ description: 'Tiêu đề ảnh' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Tên sự kiện' })
  @IsNotEmpty({ message: 'Tên sự kiện không được để trống' })
  @IsString()
  event: string;

  @ApiProperty({ description: 'Địa điểm' })
  @IsNotEmpty({ message: 'Địa điểm không được để trống' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Năm diễn ra' })
  @IsNotEmpty({ message: 'Năm không được để trống' })
  @IsNumber()
  @Min(1900, { message: 'Năm không hợp lệ' })
  year: number;

  @ApiProperty({ description: 'Danh mục', enum: GalleryCategory })
  @IsEnum(GalleryCategory, { message: 'Danh mục không hợp lệ' })
  category: GalleryCategory;

  @ApiProperty({ description: 'Mô tả', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Số lượng người tham gia', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Số lượng người tham gia không hợp lệ' })
  participants?: number;

  @ApiProperty({ description: 'ID của sự kiện liên quan', required: false })
  @IsOptional()
  @IsString()
  eventId?: string;
}

@ApiTags('gallery-images')
@Controller('gallery-images')
export class GalleryImagesController {
  constructor(private readonly galleryImagesService: GalleryImagesService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Tạo ảnh thư viện mới' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Tạo ảnh thư viện thành công' })
  create(@Body() createGalleryImageDto: CreateGalleryImageDto, @Request() req) {
    return this.galleryImagesService.create(createGalleryImageDto, req.user.sub);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload ảnh thư viện mới' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        title: { type: 'string' },
        event: { type: 'string' },
        location: { type: 'string' },
        year: { type: 'integer' },
        category: { 
          type: 'string',
          enum: Object.values(GalleryCategory)
        },
        description: { type: 'string' },
        participants: { type: 'integer' },
        eventId: { type: 'string' },
      },
      required: ['file', 'title', 'event', 'location', 'year', 'category']
    },
  })
  @ApiResponse({ status: 201, description: 'Upload ảnh thư viện thành công' })
  uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() galleryData: UploadGalleryImageDto,
    @Request() req,
  ) {
    return this.galleryImagesService.uploadGalleryImage(file, req.user.sub, galleryData);
  }

  @Patch(':id/image')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Cập nhật ảnh của gallery' })
  @ApiParam({ name: 'id', description: 'ID của ảnh gallery' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Cập nhật ảnh thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ảnh gallery' })
  updateImage(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.galleryImagesService.updateGalleryImage(id, file, req.user.sub, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách ảnh thư viện' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Số ảnh bỏ qua' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Số ảnh lấy' })
  @ApiQuery({ name: 'category', required: false, enum: GalleryCategory, description: 'Lọc theo danh mục' })
  @ApiQuery({ name: 'year', required: false, type: Number, description: 'Lọc theo năm' })
  @ApiQuery({ name: 'eventId', required: false, type: String, description: 'Lọc theo sự kiện' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm theo tiêu đề hoặc sự kiện' })
  @ApiResponse({ status: 200, description: 'Danh sách ảnh thư viện' })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('category') category?: GalleryCategory,
    @Query('year') year?: number,
    @Query('eventId') eventId?: string,
    @Query('search') search?: string,
  ) {
    const where: any = {};

    // Thêm các điều kiện lọc
    if (category) {
      where.category = category;
    }

    if (year) {
      where.year = parseInt(year.toString());
    }

    if (eventId) {
      where.eventId = eventId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { event: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.galleryImagesService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('categories')
  @ApiOperation({ summary: 'Lấy danh sách danh mục ảnh thư viện' })
  @ApiResponse({ status: 200, description: 'Danh sách danh mục và số lượng ảnh' })
  findCategories() {
    return this.galleryImagesService.findCategories();
  }

  @Get('years')
  @ApiOperation({ summary: 'Lấy danh sách các năm có ảnh thư viện' })
  @ApiResponse({ status: 200, description: 'Danh sách các năm và số lượng ảnh' })
  findYears() {
    return this.galleryImagesService.findYears();
  }

  @Get('event/:eventId')
  @ApiOperation({ summary: 'Lấy ảnh thư viện theo sự kiện' })
  @ApiParam({ name: 'eventId', description: 'ID của sự kiện' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng ảnh tối đa' })
  @ApiResponse({ status: 200, description: 'Danh sách ảnh thư viện của sự kiện' })
  findByEvent(
    @Param('eventId') eventId: string,
    @Query('limit') limit?: number,
  ) {
    return this.galleryImagesService.findByEvent(eventId, limit ? +limit : undefined);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết ảnh thư viện' })
  @ApiParam({ name: 'id', description: 'ID ảnh thư viện' })
  @ApiResponse({ status: 200, description: 'Chi tiết ảnh thư viện' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ảnh thư viện' })
  findOne(@Param('id') id: string) {
    return this.galleryImagesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Cập nhật ảnh thư viện' })
  @ApiParam({ name: 'id', description: 'ID ảnh thư viện' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Cập nhật ảnh thư viện thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ảnh thư viện' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật ảnh thư viện này' })
  update(
    @Param('id') id: string,
    @Body() updateGalleryImageDto: UpdateGalleryImageDto,
    @Request() req,
  ) {
    return this.galleryImagesService.update(id, updateGalleryImageDto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Xóa ảnh thư viện' })
  @ApiParam({ name: 'id', description: 'ID ảnh thư viện' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Xóa ảnh thư viện thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy ảnh thư viện' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa ảnh thư viện này' })
  remove(@Param('id') id: string, @Request() req) {
    return this.galleryImagesService.remove(id, req.user.sub, req.user.role);
  }
} 