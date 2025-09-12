import { Injectable, NotFoundException, ForbiddenException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { Role } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { UploadService } from '../upload/upload.service';


@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private uploadService: UploadService,) {}

    // Expose prisma for direct access
    get prismaClient() {
      return this.prisma;
    }

  // Common methods
  async create(createUserDto: CreateUserDto) {
  // The password is already hashed in AuthService, so we don't need to hash it again
  return this.prisma.user.create({
    data: {
      ...createUserDto,
    },
  });
}

  async findAll(
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

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        phone: true, // Include phone field
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        password: true, // Exclude password
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        phone: true,
        avatar: true,
        avatarId: true,
        role: true,
        provider: true,
        isVerified: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async remove(id: string) {
    const user = await this.findById(id);

    return this.prisma.user.delete({
      where: { id },
    });
  }

  async findAllForAdmin(
    role?: string,
    isActive?: string,
    keyword?: string,
    adminRole?: Role,
  ) {
    if (adminRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có thể xem tất cả tài khoản');
    }

    const where: any = {};

    if (role && Object.values(Role).includes(role as Role)) {
      where.role = role as Role;
    }
    if (isActive === "true" || isActive === "false") {
      where.isActive = isActive === "true";
    }

    if (keyword) {
      where.OR = [
        { name: { contains: keyword, mode: "insensitive" } },
        { email: { contains: keyword, mode: "insensitive" } },
      ];
    }

    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
  }

  async updateUserRole(id: string, role: Role, adminRole: Role) {
    if (adminRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có thể thay đổi quyền tài khoản');
    }

    const user = await this.findById(id);
    
    // Không cho phép Admin thay đổi role của chính mình
    if (user.id === id && user.role === Role.ADMIN) {
      throw new ForbiddenException('Không thể thay đổi quyền của chính mình');
    }

    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async toggleUserStatus(id: string, adminRole: Role) {
    if (adminRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có thể kích hoạt/vô hiệu hóa tài khoản');
    }

    const user = await this.findById(id);
    
    // Không cho phép Admin vô hiệu hóa chính mình
    if (user.id === id && user.role === Role.ADMIN) {
      throw new ForbiddenException('Không thể vô hiệu hóa tài khoản của chính mình');
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserStats(adminRole: Role) {
    if (adminRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có thể xem thống kê tài khoản');
    }

    const [
      totalUsers,
      activeUsers,
      usersByRole,
      recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { isActive: true } }),
      this.prisma.user.groupBy({
        by: ['role'],
        _count: { role: true },
      }),
      this.prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      }),
    ]);

    const roleStats = usersByRole.reduce((acc, item) => {
      acc[item.role] = item._count.role;
      return acc;
    }, {} as Record<string, number>);

    return {
      overview: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers,
      },
      byRole: roleStats,
      recentUsers,
    };
  }

  async deleteUserAccount(id: string, adminRole: Role) {
    if (adminRole !== Role.ADMIN) {
      throw new ForbiddenException('Chỉ Admin mới có thể xóa tài khoản');
    }

    const user = await this.findById(id);
    
    // Không cho phép Admin xóa chính mình
    if (user.role === Role.ADMIN) {
      throw new ForbiddenException('Không thể xóa tài khoản Admin');
    }

    return this.prisma.user.delete({
      where: { id },
    });
  }

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
}
