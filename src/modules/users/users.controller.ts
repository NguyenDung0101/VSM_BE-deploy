import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  ForbiddenException,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { Roles } from "../auth/decorators/roles.decorator";
import { RolesGuard } from "../auth/guards/roles.guard";
import { Role } from "@prisma/client";
import { FileInterceptor } from "@nestjs/platform-express";

@ApiTags("users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Create a new user (Admin only)" })
  @ApiResponse({ status: 201, description: "User created successfully" })
  @ApiResponse({ status: 403, description: "Forbidden" })
  create(@Body() createUserDto: CreateUserDto) {
    console.log('Received DTO:', createUserDto);
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiOperation({ summary: "Get all users" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  findAll() {
    return this.usersService.findAll();
  }

  @Get("admin/stats")
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get user statistics (Admin only)" })
  @ApiResponse({ status: 200, description: "User stats retrieved successfully" })
  getUserStats(@Request() req: any) {
    return this.usersService.getUserStats(req.user.role);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  @ApiResponse({ status: 200, description: "User retrieved successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  findOne(@Param("id") id: string) {
    return this.usersService.findById(id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user" })
  @ApiResponse({ status: 200, description: "User updated successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  update(
    @Param("id") id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Request() req,
  ) {
    // Users can only update their own profile, unless they're admin
    if (req.user.sub !== id && req.user.role !== Role.ADMIN) {
      throw new ForbiddenException("You can only update your own profile");
    }

    return this.usersService.update(id, updateUserDto);
  }

  @Delete(":id")
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Delete user (Admin only)" })
  @ApiResponse({ status: 200, description: "User deleted successfully" })
  @ApiResponse({ status: 404, description: "User not found" })
  remove(@Param("id") id: string) {
    return this.usersService.remove(id);
  }

  // Admin management endpoints
  @Get("admin/all")
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Get all users for admin management" })
  @ApiResponse({ status: 200, description: "Users retrieved successfully" })
  findAllForAdmin(
    @Query("role") role?: string,
    @Query("isActive") isActive?: string,
    @Query("keyword") keyword?: string,
    @Request() req?: any,
  ) {
    return this.usersService.findAllForAdmin(role, isActive, keyword, req.user.role);
  }

  @Patch(":id/role")
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Update user role (Admin only)" })
  @ApiResponse({ status: 200, description: "User role updated successfully" })
  updateUserRole(
    @Param("id") id: string,
    @Body("role") role: Role,
    @Request() req: any,
  ) {
    return this.usersService.updateUserRole(id, role, req.user.role);
  }

  @Patch(":id/toggle-status")
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Toggle user active status (Admin only)" })
  @ApiResponse({ status: 200, description: "User status updated successfully" })
  toggleUserStatus(@Param("id") id: string, @Request() req: any) {
    return this.usersService.toggleUserStatus(id, req.user.role);
  }

  

  @Delete("admin/:id")
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: "Delete user account (Admin only)" })
  @ApiResponse({ status: 200, description: "User account deleted successfully" })
  deleteUserAccount(@Param("id") id: string, @Request() req: any) {
    return this.usersService.deleteUserAccount(id, req.user.role);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Param('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    const result = await this.usersService.updateAvatar(userId, file);
    return { message: 'Avatar uploaded', avatarUrl: result.avatar };
  }
}
