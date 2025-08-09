import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGalleryImageDto } from './dto/create-gallery-image.dto';
import { UpdateGalleryImageDto } from './dto/update-gallery-image.dto';
import { GalleryCategory, Prisma, Role } from '@prisma/client';
import { UploadService } from '../upload/upload.service';

// Interface cho UploadGalleryImageDto
interface UploadGalleryImageDto {
  title: string;
  event: string;
  location: string;
  year: number;
  category: GalleryCategory;
  description?: string;
  participants?: number;
  eventId?: string;
}

@Injectable()
export class GalleryImagesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService
  ) {}

  // Tạo ảnh thư viện mới
  async create(createGalleryImageDto: CreateGalleryImageDto, userId: string) {
    // Extract eventId from DTO and remove it from data object
    const { eventId, ...imageData } = createGalleryImageDto;
    
    // Đảm bảo src luôn có giá trị
    if (!imageData.src) {
      throw new BadRequestException('Đường dẫn ảnh (src) là bắt buộc');
    }
    
    return this.prisma.galleryImage.create({
      data: {
        ...imageData,
        src: imageData.src as string, // Type assertion to ensure src is treated as string
        uploadedBy: {
          connect: {
            id: userId,
          },
        },
        ...(eventId && {
          eventRelated: {
            connect: {
              id: eventId,
            },
          },
        }),
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        eventRelated: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Upload ảnh cho gallery
  async uploadGalleryImage(file: Express.Multer.File, userId: string, galleryData: UploadGalleryImageDto) {
    // Upload ảnh lên Supabase storage
    const imageUrl = await this.uploadService.saveFile(file, 'gallery');

    // Tạo bản ghi gallery với URL ảnh từ Supabase
    return this.create({
      ...galleryData,
      src: imageUrl  // Service tự thêm src từ URL trả về của Supabase
    } as CreateGalleryImageDto, userId);
  }

  // Cập nhật ảnh cho gallery
  async updateGalleryImage(id: string, file: Express.Multer.File, userId: string, role: Role) {
    // Kiểm tra ảnh tồn tại
    const image = await this.prisma.galleryImage.findUnique({
      where: { id },
      select: { uploadedById: true, src: true },
    });

    if (!image) {
      throw new NotFoundException(`Không tìm thấy ảnh với ID ${id}`);
    }

    // Kiểm tra quyền: chỉ admin hoặc người tải lên mới được cập nhật
    if (role !== Role.ADMIN && image.uploadedById !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật ảnh này');
    }

    // Xóa ảnh cũ trên Supabase
    if (image.src) {
      try {
        await this.uploadService.deleteFile(image.src);
      } catch (error) {
        console.error('Failed to delete old gallery image:', error);
      }
    }

    // Upload ảnh mới lên Supabase
    const imageUrl = await this.uploadService.saveFile(file, 'gallery');

    // Cập nhật URL ảnh mới trong cơ sở dữ liệu
    return this.prisma.galleryImage.update({
      where: { id },
      data: { src: imageUrl },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        eventRelated: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Lấy danh sách ảnh thư viện có phân trang và lọc
  async findAll(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.GalleryImageWhereUniqueInput;
    where?: Prisma.GalleryImageWhereInput;
    orderBy?: Prisma.GalleryImageOrderByWithRelationInput;
  }) {
    const { skip, take, cursor, where, orderBy } = params;
    
    // Đếm tổng số ảnh theo điều kiện lọc
    const total = await this.prisma.galleryImage.count({ where });
    
    // Truy vấn danh sách ảnh
    const images = await this.prisma.galleryImage.findMany({
      skip,
      take,
      cursor,
      where,
      orderBy,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        eventRelated: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Trả về kết quả với metadata phân trang
    return {
      data: images,
      meta: {
        total,
        skip,
        take,
      },
    };
  }

  // Lấy danh sách danh mục và số lượng ảnh của mỗi danh mục
  async findCategories() {
    const categories = Object.values(GalleryCategory);
    
    // Đếm số lượng ảnh cho mỗi danh mục
    const categoryCounts = await Promise.all(
      categories.map(async (category) => {
        const count = await this.prisma.galleryImage.count({
          where: { category },
        });
        return { category, count };
      })
    );
    
    return categoryCounts;
  }

  // Lấy danh sách các năm và số lượng ảnh của mỗi năm
  async findYears() {
    // Lấy tất cả các năm duy nhất
    const years = await this.prisma.galleryImage.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });
    
    // Đếm số lượng ảnh cho mỗi năm
    const yearCounts = await Promise.all(
      years.map(async ({ year }) => {
        const count = await this.prisma.galleryImage.count({
          where: { year },
        });
        return { year, count };
      })
    );
    
    return yearCounts;
  }

  // Tìm ảnh theo ID
  async findOne(id: string) {
    const image = await this.prisma.galleryImage.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        eventRelated: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!image) {
      throw new NotFoundException(`Không tìm thấy ảnh với ID ${id}`);
    }

    return image;
  }

  // Cập nhật ảnh
  async update(id: string, updateGalleryImageDto: UpdateGalleryImageDto, userId: string, role: Role) {
    // Kiểm tra ảnh tồn tại
    const image = await this.prisma.galleryImage.findUnique({
      where: { id },
      select: { uploadedById: true },
    });

    if (!image) {
      throw new NotFoundException(`Không tìm thấy ảnh với ID ${id}`);
    }

    // Kiểm tra quyền: chỉ admin hoặc người tải lên mới được cập nhật
    if (role !== Role.ADMIN && image.uploadedById !== userId) {
      throw new ForbiddenException('Bạn không có quyền cập nhật ảnh này');
    }

    // Xử lý liên kết với event nếu có
    const { eventId, ...updateData } = updateGalleryImageDto;
    const data: any = { ...updateData };
    
    if (eventId !== undefined) {
      if (eventId === null) {
        // Xóa liên kết với event
        data.eventRelated = { disconnect: true };
      } else {
        // Cập nhật hoặc thêm liên kết với event
        data.eventRelated = { connect: { id: eventId } };
      }
    }

    return this.prisma.galleryImage.update({
      where: { id },
      data,
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        eventRelated: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  // Xóa ảnh
  async remove(id: string, userId: string, role: Role) {
    // Kiểm tra ảnh tồn tại
    const image = await this.prisma.galleryImage.findUnique({
      where: { id },
      select: { uploadedById: true },
    });

    if (!image) {
      throw new NotFoundException(`Không tìm thấy ảnh với ID ${id}`);
    }

    // Kiểm tra quyền: chỉ admin hoặc người tải lên mới được xóa
    if (role !== Role.ADMIN && image.uploadedById !== userId) {
      throw new ForbiddenException('Bạn không có quyền xóa ảnh này');
    }

    return this.prisma.galleryImage.delete({ where: { id } });
  }

  // Tìm ảnh theo sự kiện
  async findByEvent(eventId: string, limit?: number) {
    return this.prisma.galleryImage.findMany({
      where: {
        eventId,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      ...(limit ? { take: limit } : {}),
    });
  }
} 