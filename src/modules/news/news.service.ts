import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNewsDto } from './dto/create-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { NewsCategory, NewsStatus, Prisma, Role } from '@prisma/client';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class NewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService
  ) {}

  // Tạo bài viết mới
  async create(createNewsDto: CreateNewsDto, userId: string) {
    return this.prisma.news.create({
      data: {
        ...createNewsDto,
        author: {
          connect: {
            id: userId,
          },
        },
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  // Cập nhật ảnh đại diện cho bài viết
  async uploadCoverImage(id: string, file: Express.Multer.File, userId: string, role: Role) {
    // Kiểm tra bài viết tồn tại
    const news = await this.prisma.news.findUnique({
      where: { id },
      select: { authorId: true, cover: true },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
    }

    // Kiểm tra quyền: chỉ admin hoặc tác giả mới được cập nhật
    if (role !== Role.ADMIN && news.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật bài viết này');
    }

    // Nếu đã có ảnh cũ, xóa ảnh cũ
    if (news.cover) {
      try {
        await this.uploadService.deleteFile(news.cover);
      } catch (error) {
        console.error('Failed to delete old cover image:', error);
      }
    }

    // Upload ảnh mới
    const coverUrl = await this.uploadService.saveFile(file, 'news');

    // Cập nhật URL ảnh trong database
    return this.prisma.news.update({
      where: { id },
      data: { cover: coverUrl },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  // Lấy danh sách bài viết có phân trang và lọc
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.NewsWhereUniqueInput;
    where?: Prisma.NewsWhereInput;
    orderBy?: Prisma.NewsOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    
    // Đếm tổng số bài viết theo điều kiện lọc
    const total = await this.prisma.news.count({ where });
    
    // Truy vấn danh sách bài viết
    const news = await this.prisma.news.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    // Trả về kết quả với metadata phân trang
    return {
      data: news.map(item => ({
        ...item,
        commentsCount: item._count.comments,
        likes: item._count.likes,
        _count: undefined
      })),
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  // Tìm bài viết theo ID và tăng lượt xem
  async findOne(id: string, incrementViews: boolean = false) {
    const news = await this.prisma.news.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
    }

    // Tăng lượt xem nếu yêu cầu
    if (incrementViews) {
      await this.prisma.news.update({
        where: { id },
        data: { views: { increment: 1 } },
      });
    }

    return {
      ...news,
      commentsCount: news._count.comments,
      likes: news._count.likes,
      _count: undefined
    };
  }

  // Cập nhật bài viết
  async update(id: string, updateNewsDto: UpdateNewsDto, userId: string, role: Role) {
    // Kiểm tra bài viết tồn tại
    const news = await this.prisma.news.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
    }

    // Kiểm tra quyền: chỉ admin hoặc tác giả mới được cập nhật
    if (role !== Role.ADMIN && news.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật bài viết này');
    }

    return this.prisma.news.update({
      where: { id },
      data: updateNewsDto,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
    });
  }

  // Xóa bài viết
  async remove(id: string, userId: string, role: Role) {
    // Kiểm tra bài viết tồn tại
    const news = await this.prisma.news.findUnique({
      where: { id },
      select: { authorId: true },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
    }

    // Kiểm tra quyền: chỉ admin hoặc tác giả mới được xóa
    if (role !== Role.ADMIN && news.authorId !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa bài viết này');
    }

    return this.prisma.news.delete({ where: { id } });
  }

  // Tìm bài viết liên quan
  async findRelated(id: string, limit: number = 2) {
    const news = await this.prisma.news.findUnique({
      where: { id },
      select: { category: true, tags: true },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
    }

    // Tìm các bài viết cùng category, không bao gồm bài viết hiện tại
    return this.prisma.news.findMany({
      where: {
        id: { not: id },
        category: news.category,
        status: NewsStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }).then(relatedNews => 
      relatedNews.map(item => ({
        ...item,
        commentsCount: item._count.comments,
        likes: item._count.likes,
        _count: undefined
      }))
    );
  }

  // Thêm hoặc bỏ lượt thích
  async toggleLike(newsId: string, userId: string) {
    // Kiểm tra bài viết tồn tại
    const news = await this.prisma.news.findUnique({
      where: { id: newsId },
    });

    if (!news) {
      throw new NotFoundException(`Không tìm thấy bài viết với ID ${newsId}`);
    }

    // Kiểm tra xem người dùng đã thích bài viết chưa
    const existingLike = await this.prisma.like.findUnique({
      where: {
        newsId_userId: {
          newsId,
          userId,
        },
      },
    });

    // Nếu đã thích thì bỏ thích, nếu chưa thì thêm lượt thích
    if (existingLike) {
      await this.prisma.like.delete({
        where: {
          id: existingLike.id,
        },
      });
      return { liked: false };
    } else {
      await this.prisma.like.create({
        data: {
          newsId,
          userId,
        },
      });
      return { liked: true };
    }
  }

  // Kiểm tra xem người dùng đã thích bài viết chưa
  async checkIfUserLiked(newsId: string, userId: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        newsId_userId: {
          newsId,
          userId,
        },
      },
    });
    
    return { liked: !!like };
  }

  // Lấy bài viết nổi bật
  async findFeatured(limit: number = 3) {
    return this.prisma.news.findMany({
      where: {
        featured: true,
        status: NewsStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    }).then(featuredNews => 
      featuredNews.map(item => ({
        ...item,
        commentsCount: item._count.comments,
        likes: item._count.likes,
        _count: undefined
      }))
    );
  }

  // Lấy bài viết phổ biến (nhiều lượt xem nhất)
  async findPopular(limit: number = 5) {
    return this.prisma.news.findMany({
      where: {
        status: NewsStatus.PUBLISHED,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: { views: 'desc' },
      take: limit,
    }).then(popularNews => 
      popularNews.map(item => ({
        ...item,
        commentsCount: item._count.comments,
        likes: item._count.likes,
        _count: undefined
      }))
    );
  }
} 