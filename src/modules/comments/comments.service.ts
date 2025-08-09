import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { CommentStatus, Prisma, Role } from '@prisma/client';

@Injectable()
export class CommentsService {
  constructor(private readonly prisma: PrismaService) {}

  // Tạo bình luận mới
  async create(createCommentDto: CreateCommentDto, userId: string) {
    // Kiểm tra bài viết tồn tại
    const news = await this.prisma.news.findUnique({
      where: { id: createCommentDto.newsId },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${createCommentDto.newsId}`);
    }

    // Nếu có parentId, kiểm tra bình luận cha tồn tại
    if (createCommentDto.parentId) {
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: createCommentDto.parentId },
      });

      if (!parentComment) {
        throw new NotFoundException(`Không tìm thấy bình luận cha với ID ${createCommentDto.parentId}`);
      }

      // Kiểm tra xem bình luận cha có thuộc về bài viết này không
      if (parentComment.newsId !== createCommentDto.newsId) {
        throw new ForbiddenException('Bình luận cha không thuộc về bài viết này');
      }
    }

    // Tạo bình luận mới
    return this.prisma.comment.create({
      data: {
        ...createCommentDto,
        userId,
        status: CommentStatus.PENDING, // Mặc định là chờ duyệt
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  // Lấy danh sách bình luận của bài viết
  async findAllByNewsId(newsId: string, skip: number = 0, take: number = 10) {
    // Kiểm tra bài viết tồn tại
    const news = await this.prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${newsId}`);
    }

    // Tìm tất cả bình luận gốc (không có parentId) và đã được duyệt
    const comments = await this.prisma.comment.findMany({
      where: {
        newsId,
        parentId: null,
        status: CommentStatus.APPROVED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    // Đếm tổng số bình luận gốc của bài viết
    const total = await this.prisma.comment.count({
      where: {
        newsId,
        parentId: null,
        status: CommentStatus.APPROVED,
      },
    });

    // Tìm tất cả bình luận con (replies) của các bình luận gốc
    const commentIds = comments.map(comment => comment.id);
    const replies = await this.prisma.comment.findMany({
      where: {
        parentId: {
          in: commentIds,
        },
        status: CommentStatus.APPROVED,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Gộp bình luận con vào bình luận gốc
    const commentsWithReplies = comments.map(comment => {
      const commentReplies = replies.filter(reply => reply.parentId === comment.id);
      return {
        ...comment,
        replies: commentReplies,
      };
    });

    return {
      data: commentsWithReplies,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  // Lấy danh sách bình luận chờ duyệt (chỉ dành cho admin)
  async findPendingComments(skip: number = 0, take: number = 10) {
    const comments = await this.prisma.comment.findMany({
      where: {
        status: CommentStatus.PENDING,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        news: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });

    const total = await this.prisma.comment.count({
      where: {
        status: CommentStatus.PENDING,
      },
    });

    return {
      data: comments,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  // Phê duyệt bình luận (chỉ dành cho admin)
  async approveComment(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Không tìm thấy bình luận với ID ${id}`);
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        status: CommentStatus.APPROVED,
      },
    });
  }

  // Từ chối bình luận (chỉ dành cho admin)
  async rejectComment(id: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException(`Không tìm thấy bình luận với ID ${id}`);
    }

    return this.prisma.comment.update({
      where: { id },
      data: {
        status: CommentStatus.REJECTED,
      },
    });
  }

  // Xóa bình luận
  async remove(id: string, userId: string, role: Role) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        user: true,
      },
    });

    if (!comment) {
      throw new NotFoundException(`Không tìm thấy bình luận với ID ${id}`);
    }

    // Kiểm tra quyền: chỉ admin hoặc người tạo mới được xóa
    if (role !== Role.ADMIN && comment.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
    }

    return this.prisma.comment.delete({
      where: { id },
    });
  }
} 