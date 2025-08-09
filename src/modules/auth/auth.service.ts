import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
  
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      return null;
    }
  
    // Debug mật khẩu
    console.log("🔍 Password in DB (should be hash):", user.password);
    console.log("🔍 Password entered by user:", password);
  
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("🔍 Password match result:", isMatch);
  
    if (isMatch) {
      // Xoá password trước khi return (không cần toObject)
      const { password: _, ...safeUser } = user;
      return safeUser;
    }
  
    return null;
  }
  

  // Login method for user authentication
  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    if (!user.isActive) {
      throw new UnauthorizedException("Account is deactivated");
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
      },
    };
  }

  // Register method for creating new users
 async register(registerDto: RegisterDto, user: any) {
  // Validate email domain
  if (!registerDto.email.endsWith('@vsm.org.vn')) {
    throw new UnauthorizedException("Email must end with @vsm.org.vn");
  }

  // Check if user already exists
  const existingUser = await this.usersService.findByEmail(registerDto.email);
  if (existingUser) {
    throw new ConflictException("User with this email already exists");
  }

  // Determine who is registering
  let roleToAssign = registerDto.role; // Role from DTO, if provided by admin
  if (!user) {
    // User self-registration (no authenticated user)
    if (roleToAssign) {
      throw new UnauthorizedException("Regular users cannot assign roles");
    }
    roleToAssign = 'USER'; // Default role for self-registration
  } else {
    // Admin or Editor attempting to create account
    if (user.role === 'EDITOR') {
      throw new ForbiddenException("Editors cannot create accounts");
    }
    if (user.role !== 'ADMIN' && roleToAssign) {
      throw new UnauthorizedException("Only admins can assign roles");
    }
    // Admin can assign any role, or keep default USER if not specified
    roleToAssign = roleToAssign || 'USER';
    if (roleToAssign && !['ADMIN', 'EDITOR', 'USER'].includes(roleToAssign)) {
      throw new UnauthorizedException("Invalid role assigned");
    }
  }

  console.log("=== REGISTER DEBUG ===");
console.log("Raw password:", registerDto.password);
  // Hash password
  const hashedPassword = await bcrypt.hash(registerDto.password, 10);
console.log("Hashed password:", hashedPassword);

  // Create user data with only necessary fields
  const userData = {
    name: registerDto.name,
    email: registerDto.email,
    password: hashedPassword,
    avatar: registerDto.avatar,
    role: roleToAssign,
  };

  // Create user (rename 'user' to 'createdUser' to avoid conflict)
  const createdUser = await this.usersService.create(userData);

  // Generate token
  const payload = {
    sub: createdUser.id,
    email: createdUser.email,
    role: createdUser.role,
  };

  return {
    access_token: this.jwtService.sign(payload),
    user: {
      id: createdUser.id,
      name: createdUser.name,
      email: createdUser.email,
      avatar: createdUser.avatar,
      role: createdUser.role,
    },
  };
}

  // Method to get user profile
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedException("User not found");
    }

    const { password, ...profile } = user;
    return profile;
  }

  // Admin creates account for Editor/Admin
  async createAccount(registerDto: RegisterDto, adminUser: any) {
    if (adminUser.role !== 'ADMIN') {
      throw new ForbiddenException('Chỉ Admin mới có thể tạo tài khoản cho Editor/Admin');
    }

    // Validate email domain
    if (!registerDto.email.endsWith('@vsm.org.vn')) {
      throw new UnauthorizedException("Email must end with @vsm.org.vn");
    }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Validate role
    if (!registerDto.role || !['ADMIN', 'EDITOR', 'USER'].includes(registerDto.role)) {
      throw new UnauthorizedException("Invalid role specified");
    }

    // Hash password - this will be used directly in userData
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Create user data
    const userData = {
      name: registerDto.name,
      email: registerDto.email,
      password: hashedPassword,
      avatar: registerDto.avatar,
      role: registerDto.role,
    };

    // Create user
    const createdUser = await this.usersService.create(userData);

    return {
      message: `Tài khoản ${registerDto.role} đã được tạo thành công`,
      user: {
        id: createdUser.id,
        name: createdUser.name,
        email: createdUser.email,
        avatar: createdUser.avatar,
        role: createdUser.role,
      },
    };
  }

  // Thêm phương thức checkAccountExists
  async checkAccountExists(email: string) {
    return this.usersService.findByEmail(email);
  }

  // Thêm phương thức resetPassword
  async resetPassword(email: string, newPassword: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật mật khẩu trong database
    await this.usersService.update(user.id, {
      password: hashedPassword,
    });
    
    return {
      success: true,
      message: 'Password has been reset successfully',
    };
  }
}
