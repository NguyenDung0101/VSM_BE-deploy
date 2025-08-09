import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { Role, EventStatus } from '@prisma/client';
import { UploadService } from '../upload/upload.service';
import { BaseService } from '../../common/services/base.service';

@Injectable()
export class EventsService extends BaseService<any> {
  constructor(
    protected prisma: PrismaService,
    private uploadService: UploadService,
  ) {
    super(prisma, 'Event', 'event');
  }

  // Đổi tên phương thức để tránh xung đột với BaseService.create()
  async createEvent(createEventDto: CreateEventDto, userId: string, userRole: Role, file?: Express.Multer.File) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể tạo sự kiện');
    }

    let imageId: string | undefined;
    let imageUrl: string | undefined;

    if (file) {
      // Lưu file ảnh vào thư mục public/image/events
      imageUrl = await this.uploadService.saveFile(file, 'events');
      // Tạo bản ghi Image trong cơ sở dữ liệu
      const image = await this.prisma.image.create({
        data: {
          url: imageUrl,
          type: 'event_post',
          eventId: undefined,
        },
      });
      imageId = image.id;
    }

    const eventData = {
      ...createEventDto,
      imageEvent: imageUrl,
      date: new Date(createEventDto.date),
      registrationDeadline: createEventDto.registrationDeadline
        ? new Date(createEventDto.registrationDeadline)
        : null,
      authorId: userId,
      currentParticipants: 0,
      image: imageId ? { connect: { id: imageId } } : undefined,
    };

    // Sử dụng phương thức create từ BaseService
    return super.create(eventData, {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      image: true,
    });
  }

  // Các phương thức khác không thay đổi
  async findOne(id: string) {
    return super.findOne(id, {
      author: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      image: true,
      registrations: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      },
      _count: {
        select: {
          registrations: true,
        },
      },
    });
  }

  async findEvents(query?: any) {
    const {
      category,
      status,
      featured,
      search,
      upcoming = 'true',
      limit = '10',
      page = '1',
    } = query || {};

    const where: any = { published: true };

    if (category) where.category = category;
    if (status) where.status = status;
    if (featured === 'true') where.featured = true;
    if (upcoming === 'true') {
      where.date = { gte: new Date() };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    return super.findAll({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        image: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: { date: 'asc' },
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  async findAllForAdmin(query: any, userRole: Role) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể xem tất cả sự kiện');
    }

    const {
      category,
      status,
      published,
      search,
      authorId,
      startDate,
      endDate,
      limit = '10',
      page = '1',
    } = query || {};

    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (published === 'true' || published === 'false') {
      where.published = published === 'true';
    }
    if (authorId) where.authorId = authorId;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { location: { contains: search, mode: 'insensitive' } },
      ];
    }

    return super.findAll({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        image: true,
        _count: {
          select: {
            registrations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      page: parseInt(page),
      limit: parseInt(limit),
    });
  }

  // Các phương thức đặc thù khác
} 