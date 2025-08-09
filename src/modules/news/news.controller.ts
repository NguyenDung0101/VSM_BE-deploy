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
  HttpCode,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { NewsService } from './news.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';

@ApiTags('news')
@Controller('news')
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Tạo bài viết mới' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Tạo bài viết thành công' })
  create(@Body() createNewsDto: CreateNewsDto, @Request() req) {
    return this.newsService.create(createNewsDto, req.user.sub);
  }

  @Post(':id/cover')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload ảnh đại diện cho bài viết' })
  @ApiConsumes('multipart/form-data')
  @ApiParam({ name: 'id', description: 'ID bài viết' })
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
  @ApiResponse({ status: 200, description: 'Upload ảnh thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật bài viết này' })
  uploadCover(
    @Param('id') id: string,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    return this.newsService.uploadCoverImage(id, file, req.user.sub, req.user.role);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bài viết' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Số bài viết bỏ qua' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Số bài viết lấy' })
  @ApiQuery({ name: 'category', required: false, enum: ['TRAINING', 'NUTRITION', 'EVENTS', 'TIPS'], description: 'Lọc theo danh mục' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Tìm kiếm trong tiêu đề hoặc tags' })
  @ApiQuery({ name: 'featured', required: false, type: Boolean, description: 'Lọc bài viết nổi bật' })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết' })
  findAll(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('category') category?: string,
    @Query('search') search?: string,
    @Query('featured') featured?: string | boolean,
  ) {
    const where: any = {
      status: 'PUBLISHED',
    };

    // Thêm các điều kiện lọc
    if (category) {
      where.category = category;
    }

    if (featured !== undefined) {
      where.featured = String(featured).toLowerCase() === 'true' || featured === true;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { tags: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.newsService.findAll({
      skip: skip ? +skip : 0,
      take: take ? +take : 10,
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get('featured')
  @ApiOperation({ summary: 'Lấy bài viết nổi bật' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng bài viết tối đa' })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết nổi bật' })
  findFeatured(@Query('limit') limit?: number) {
    return this.newsService.findFeatured(limit ? +limit : 3);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Lấy bài viết phổ biến' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng bài viết tối đa' })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết phổ biến' })
  findPopular(@Query('limit') limit?: number) {
    return this.newsService.findPopular(limit ? +limit : 5);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bài viết' })
  @ApiParam({ name: 'id', description: 'ID bài viết' })
  @ApiQuery({ name: 'increment_views', required: false, type: Boolean, description: 'Tăng lượt xem' })
  @ApiResponse({ status: 200, description: 'Chi tiết bài viết' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  findOne(
    @Param('id') id: string,
    @Query('increment_views') incrementViews?: string | boolean,
  ) {
    return this.newsService.findOne(id, String(incrementViews).toLowerCase() === 'true' || incrementViews === true);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Cập nhật bài viết' })
  @ApiParam({ name: 'id', description: 'ID bài viết' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Cập nhật bài viết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @ApiResponse({ status: 403, description: 'Không có quyền cập nhật bài viết này' })
  update(
    @Param('id') id: string,
    @Body() updateNewsDto: UpdateNewsDto,
    @Request() req,
  ) {
    return this.newsService.update(id, updateNewsDto, req.user.sub, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.EDITOR)
  @ApiOperation({ summary: 'Xóa bài viết' })
  @ApiParam({ name: 'id', description: 'ID bài viết' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Xóa bài viết thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa bài viết này' })
  remove(@Param('id') id: string, @Request() req) {
    return this.newsService.remove(id, req.user.sub, req.user.role);
  }

  @Get(':id/related')
  @ApiOperation({ summary: 'Lấy bài viết liên quan' })
  @ApiParam({ name: 'id', description: 'ID bài viết' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng bài viết tối đa' })
  @ApiResponse({ status: 200, description: 'Danh sách bài viết liên quan' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  findRelated(
    @Param('id') id: string,
    @Query('limit') limit?: number,
  ) {
    return this.newsService.findRelated(id, limit ? +limit : 2);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  @ApiOperation({ summary: 'Thích hoặc bỏ thích bài viết' })
  @ApiParam({ name: 'id', description: 'ID bài viết' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Thao tác thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  toggleLike(@Param('id') id: string, @Request() req) {
    return this.newsService.toggleLike(id, req.user.sub);
  }

  @Get(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Kiểm tra xem người dùng đã thích bài viết chưa' })
  @ApiParam({ name: 'id', description: 'ID bài viết' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Trạng thái like' })
  checkIfUserLiked(@Param('id') id: string, @Request() req) {
    return this.newsService.checkIfUserLiked(id, req.user.sub);
  }
} 