import { 
  Injectable, 
  ConflictException, 
  NotFoundException, 
  BadRequestException,
  ForbiddenException 
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterEventDto } from './dto/register-event.dto';
import { RegistrationStatus, Role } from '@prisma/client';

@Injectable()
export class EventRegistrationsService {
  constructor(private prisma: PrismaService) {}

  async registerForEvent(eventId: string, userId: string, registerDto: RegisterEventDto) {
    // Kiểm tra sự kiện có tồn tại không
    const event = await this.prisma.event.findUnique({
      where: { id: eventId },
      include: { registrations: true },
    });

    if (!event) {
      throw new NotFoundException('Sự kiện không tồn tại');
    }

    if (!event.published) {
      throw new BadRequestException('Sự kiện chưa được công bố');
    }

    // Kiểm tra deadline đăng ký
    if (event.registrationDeadline && new Date() > event.registrationDeadline) {
      throw new BadRequestException('Đã hết hạn đăng ký sự kiện');
    }

    // Kiểm tra user đã đăng ký chưa
    const existingRegistration = await this.prisma.eventRegistration.findFirst({
      where: { eventId, userId },
    });

    if (existingRegistration) {
      throw new ConflictException('Bạn đã đăng ký sự kiện này rồi');
    }

    // Kiểm tra số lượng người tham gia
    const confirmedCount = event.registrations.filter(
      reg => reg.status === RegistrationStatus.CONFIRMED
    ).length;

    let status: RegistrationStatus = RegistrationStatus.PENDING;
    if (confirmedCount >= event.maxParticipants) {
      status = RegistrationStatus.WAITLIST;
    } else if (confirmedCount >= event.maxParticipants * 0.9) { // 90% capacity -> WAITLIST
      status = RegistrationStatus.WAITLIST;
    }

    // Tạo đăng ký mới
    const registration = await this.prisma.eventRegistration.create({
      data: {
        ...registerDto,
        eventId,
        userId,
        status,
        registeredAt: new Date(), // Thêm trường registeredAt nếu có trong schema
      },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
          },
        },
      },
    });

    // Cập nhật số lượng người tham gia nếu được xác nhận hoặc pending
    // if (status === RegistrationStatus.CONFIRMED || status === RegistrationStatus.PENDING) {
    if ( status === RegistrationStatus.PENDING) {
      await this.prisma.event.update({
        where: { id: eventId },
        data: {
          currentParticipants: {
            increment: 1,
          },
        },
      });
    }

    return registration;
  }

  async getUserRegistrations(userId: string) {
    return this.prisma.eventRegistration.findMany({
      where: { userId },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
            image: true,
            category: true,
            status: true,
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async getEventRegistrations(eventId: string, userRole: Role) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể xem danh sách đăng ký');
    }

    return this.prisma.eventRegistration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: { registeredAt: 'desc' },
    });
  }

  async updateRegistrationStatus(
    registrationId: string,
    status: RegistrationStatus,
    userRole: Role,
  ) {
    if (userRole !== Role.EDITOR && userRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Editor và Admin mới có thể cập nhật trạng thái đăng ký');
    }

    // Kiểm tra trạng thái hợp lệ
    if (!Object.values(RegistrationStatus).includes(status)) {
      throw new BadRequestException('Trạng thái không hợp lệ');
    }

    const registration = await this.prisma.eventRegistration.findUnique({
      where: { id: registrationId },
      include: { event: true },
    });

    if (!registration) {
      throw new NotFoundException('Đăng ký không tồn tại');
    }

    const oldStatus = registration.status;
    if (oldStatus === status) {
      throw new BadRequestException('Trạng thái không thay đổi');
    }

    const updatedRegistration = await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status },
      include: {
        event: {
          select: {
            id: true,
            name: true,
            date: true,
            location: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Cập nhật số lượng người tham gia
    let increment = 0;
    if (oldStatus === RegistrationStatus.CONFIRMED && status !== RegistrationStatus.CONFIRMED) {
      increment = -1;
    } else if (oldStatus !== RegistrationStatus.CONFIRMED && status === RegistrationStatus.CONFIRMED) {
      increment = 1;
    }

    if (increment !== 0) {
      await this.prisma.event.update({
        where: { id: registration.eventId },
        data: {
          currentParticipants: {
            increment,
          },
        },
      });
    }

    return updatedRegistration;
  }

  async cancelRegistration(registrationId: string, userId: string) {
    const registration = await this.prisma.eventRegistration.findFirst({
      where: {
        id: registrationId,
        userId,
      },
      include: { event: true },
    });

    if (!registration) {
      throw new NotFoundException('Đăng ký không tồn tại hoặc bạn không có quyền hủy');
    }

    if (registration.event.date < new Date()) {
      throw new BadRequestException('Không thể hủy đăng ký sau khi sự kiện đã diễn ra');
    }

    const updatedRegistration = await this.prisma.eventRegistration.update({
      where: { id: registrationId },
      data: { status: RegistrationStatus.CANCELLED },
      include: { event: true },
    });

    // Giảm số lượng người tham gia nếu đã được xác nhận
    if (registration.status === RegistrationStatus.CONFIRMED) {
      await this.prisma.event.update({
        where: { id: registration.eventId },
        data: {
          currentParticipants: {
            decrement: 1,
          },
        },
      });
    }

    return updatedRegistration;
  }

  async getRegistrationStats(eventId?: string) {
    const where = eventId ? { eventId } : {};

    const [total, confirmed, pending, waitlist, cancelled] = await Promise.all([
      this.prisma.eventRegistration.count({ where }),
      this.prisma.eventRegistration.count({ where: { ...where, status: RegistrationStatus.CONFIRMED } }),
      this.prisma.eventRegistration.count({ where: { ...where, status: RegistrationStatus.PENDING } }),
      this.prisma.eventRegistration.count({ where: { ...where, status: RegistrationStatus.WAITLIST } }),
      this.prisma.eventRegistration.count({ where: { ...where, status: RegistrationStatus.CANCELLED } }),
    ]);

    return {
      total,
      confirmed,
      pending,
      waitlist,
      cancelled,
    };
  }
}