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
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Tạo bình luận mới' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Tạo bình luận thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  create(@Body() createCommentDto: CreateCommentDto, @Request() req) {
    return this.commentsService.create(createCommentDto, req.user.id);
  }

  @Get('news/:newsId')
  @ApiOperation({ summary: 'Lấy danh sách bình luận của bài viết' })
  @ApiParam({ name: 'newsId', description: 'ID bài viết' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Số bình luận bỏ qua' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Số bình luận lấy' })
  @ApiResponse({ status: 200, description: 'Danh sách bình luận' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài viết' })
  findAllByNewsId(
    @Param('newsId') newsId: string,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.commentsService.findAllByNewsId(newsId, skip ? +skip : 0, take ? +take : 10);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách bình luận chờ duyệt (chỉ dành cho admin)' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Số bình luận bỏ qua' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Số bình luận lấy' })
  @ApiResponse({ status: 200, description: 'Danh sách bình luận chờ duyệt' })
  findPendingComments(
    @Query('skip') skip?: number,
    @Query('take') take?: number,
  ) {
    return this.commentsService.findPendingComments(skip ? +skip : 0, take ? +take : 10);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Phê duyệt bình luận (chỉ dành cho admin)' })
  @ApiParam({ name: 'id', description: 'ID bình luận' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Phê duyệt bình luận thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bình luận' })
  approveComment(@Param('id') id: string) {
    return this.commentsService.approveComment(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Từ chối bình luận (chỉ dành cho admin)' })
  @ApiParam({ name: 'id', description: 'ID bình luận' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Từ chối bình luận thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bình luận' })
  rejectComment(@Param('id') id: string) {
    return this.commentsService.rejectComment(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Xóa bình luận' })
  @ApiParam({ name: 'id', description: 'ID bình luận' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Xóa bình luận thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bình luận' })
  @ApiResponse({ status: 403, description: 'Không có quyền xóa bình luận này' })
  remove(@Param('id') id: string, @Request() req) {
    return this.commentsService.remove(id, req.user.id, req.user.role);
  }
} 