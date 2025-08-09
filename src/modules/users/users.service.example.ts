import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Role } from '@prisma/client';
import { BaseService } from '../../common/services/base.service';
import { UploadService } from '../upload/upload.service';

@Injectable()
export class UsersService extends BaseService<any> {
  constructor(
    protected prisma: PrismaService, 
    private uploadService: UploadService
  ) {
    // Truyền PrismaService, tên thực thể, và tên model vào BaseService
    super(prisma, 'User', 'user');
  }

  // Sử dụng phương thức từ lớp BaseService hoặc ghi đè nếu cần chức năng riêng
  async create(createUserDto: CreateUserDto) {
    // The password is already hashed in AuthService, so we don't need to hash it again
    return super.create(createUserDto);
  }

  // Phương thức tùy chỉnh với logic phức tạp hơn - đổi tên để tránh xung đột
  async findUsers(
    role?: string,
    isActive?: string,
    keyword?: string,
  ) {
    const where: any = {};

    if (role) where.role = role;
    if (isActive === "true" || isActive === "false")
      where.isActive = isActive === "true";

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { email: { contains: keyword, mode: "insensitive" } },
      ];
    }

    const include = {
      // Thêm các quan hệ cần include nếu có
    };

    const select = {
      id: true,
      name: true,
      email: true,
      avatar: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      phone: true,
    };

    // Sử dụng phương thức findAll từ BaseService với các tùy chọn riêng
    return super.findAll({
      where,
      include,
      orderBy: { createdAt: 'desc' }
    });
  }

  // Phương thức riêng không có trong BaseService
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  // Các phương thức tùy chỉnh khác đặc thù cho UsersService
  async updateAvatar(userId: string, file: Express.Multer.File) {
    const oldUser = await this.prisma.user.findUnique({ where: { id: userId } });
    if (oldUser?.avatar) {
      await this.uploadService.deleteFile(oldUser.avatar);
    }
    const avatarUrl = await this.uploadService.saveFile(file, 'avatars');
    return this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
    });
  }

  // Thêm các phương thức đặc thù khác của UsersService
  async findAllForAdmin(
    role?: string,
    isActive?: string,
    keyword?: string,
    adminRole?: Role,
  ) {
    if (adminRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có thể xem tất cả tài khoản');
    }

    return this.findUsers(role, isActive, keyword);
  }

  // Các phương thức khác đặc thù cho UsersService
} 