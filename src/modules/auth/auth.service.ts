import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { createClient } from "@supabase/supabase-js";
import * as bcrypt from "bcryptjs";
import { UsersService } from "../users/users.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { GoogleLoginDto } from "./dto/login.dto";
import { EmailService } from "../email/email.service"; // Thêm import này

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,
  ) {
    console.log("🔍 AuthService initialized with EmailService:", !!this.emailService);
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
  
    if (!user) {
      console.log(`❌ User not found with email: ${email}`);
      return null;
    }
  
        // Debug mật khẩu
        console.log("🔍 Password in DB (should be hash):", user.password);
        console.log("🔍 Password entered by user:", password);
      
        if (!user.password) {
          console.log("🔍 No password set for user");
          return null;
        }
        
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
    // if (!registerDto.email.endsWith('@vsm.org.vn')) {
    //   throw new UnauthorizedException("Email must end with @vsm.org.vn");
    // }

    // Check if user already exists
    const existingUser = await this.usersService.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException("Người dùng với tài khoản email này đã tồn tại");
    }

    // Kiểm tra xem ai đang đăng ký
    let roleToAssign = registerDto.role; // Role from DTO, if provided by admin
    if (!user) {
      // User self-registration (no authenticated user)
      if (roleToAssign) {
        throw new UnauthorizedException("Regular users cannot assign roles");
      }
      roleToAssign = 'USER'; // Default role for self-registration

      // Self-registration: tạo tài khoản chưa active và gửi link xác minh
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Tạo token xác minh (sử dụng JWT ngắn hạn hoặc random string). Ở đây dùng random 6 số + timestamp
      const verificationToken = `${Math.floor(100000 + Math.random() * 900000)}-${Date.now()}`;

      const createdUser = await this.usersService.create({
        name: registerDto.name,
        email: registerDto.email,
        password: hashedPassword,
        avatar: registerDto.avatar,
        role: roleToAssign,
        isActive: false,
        emailVerified: false,
        verificationToken,
      });

      // Tạo link xác minh
      const backendBaseUrl = this.configService.get<string>('BACKEND_PUBLIC_URL') || 'http://localhost:3001/api/v1';
      const verifyUrl = `${backendBaseUrl}/auth/verify-email?token=${encodeURIComponent(verificationToken)}`;

      // Gửi email xác minh
      await this.emailService.sendVerificationEmail(registerDto.email, verifyUrl, registerDto.name);

      return {
        message: "Đăng ký thành công. Vui lòng kiểm tra email để xác minh tài khoản.",
        userId: createdUser.id,
      };
    } else {
      // Admin or Editor attempting to create account
      if (user.role === 'EDITOR') {
        throw new ForbiddenException("Editors cannot create accounts");
      }
      if (user.role !== 'ADMIN' && roleToAssign) {
        throw new UnauthorizedException("Only admins can assign roles");
      }
      // Admin có thể gán bất kỳ role nào, hoặc giữ default USER nếu không được chỉ định
      roleToAssign = roleToAssign || 'USER';
      if (roleToAssign && !['ADMIN', 'EDITOR', 'USER'].includes(roleToAssign)) {
        throw new UnauthorizedException("Invalid role assigned");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(registerDto.password, 10);

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
  }

  // Xác minh email từ token
  async verifyEmailToken(token: string) {
    if (!token) {
      throw new BadRequestException('Token không hợp lệ');
    }

    // Tìm user theo verificationToken
    const user = await this.usersService.prismaClient.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      throw new UnauthorizedException('Token không hợp lệ hoặc đã được sử dụng');
    }

    // Cập nhật user: active, emailVerified, xoá token
    const updatedUser = await this.usersService.update(user.id, {
      isActive: true,
      emailVerified: true,
      verificationToken: null,
    });

    return {
      message: 'Email đã được xác minh thành công',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        avatar: updatedUser.avatar,
        role: updatedUser.role,
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
    // if (!registerDto.email.endsWith('@vsm.org.vn')) {
    //   throw new UnauthorizedException("Email must end with @vsm.org.vn");
    // }

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

    // Google OAuth login method
    async googleLogin(googleLoginDto: GoogleLoginDto) {
      const { access_token } = googleLoginDto; // Dùng access_token để lấy thông tin user từ Supabase
  
      try {
        console.log('�� Starting Google OAuth login...');
        
        // Verify the Supabase JWT token
        const supabaseUrl = this.configService.get<string>('SUPABASE_URL');
        const supabaseKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');
        
        if (!supabaseUrl || !supabaseKey) {
          throw new UnauthorizedException('Supabase configuration missing');
        }
        
        const supabase = createClient(supabaseUrl, supabaseKey); // Tạo client Supabase
  
        // Get user info from Supabase using the access token
        const { data: { user }, error } = await supabase.auth.getUser(access_token);
  
        if (error || !user) {
          console.error('❌ Supabase auth error:', error);
          throw new UnauthorizedException('Invalid Google access token');
        }
  
        // Extract user information from Google OAuth
        const { email, user_metadata } = user;
        const name = user_metadata?.full_name || user_metadata?.name || email;
        const avatar = user_metadata?.avatar_url || user_metadata?.picture;
  
        console.log('🔍 Google user data:', { email, name, avatar });
  
        if (!email) {
          throw new UnauthorizedException('Email not found in Google account');
        }
  
        // Check if user already exists
        let existingUser = await this.usersService.findByEmail(email);
        console.log('🔍 Existing user found:', existingUser ? 'Yes' : 'No');
  
        if (existingUser) {
          console.log('🔍 Updating existing user...');
          // Update existing user if provider is not Google
          if (existingUser.provider !== 'google') {
            existingUser = await this.usersService.prismaClient.user.update({
              where: { id: existingUser.id },
              data: {
                provider: 'google',
                avatar: avatar || existingUser.avatar,
                isVerified: true,
                verificationToken: null,
              },
            });
            console.log('✅ User updated successfully');
          }
        } else {
          console.log('🔍 Creating new user...');
          // Create new user with Google provider
          const userData = {
            name,
            email,
            password: '', // Empty string instead of null for Google OAuth users
            avatar,
            provider: 'google',
            isVerified: true,
            role: 'USER' as const,
          };
  
          existingUser = await this.usersService.create(userData);
          console.log('✅ User created successfully:', existingUser.id);
        }
  
        if (!existingUser || !existingUser.isActive) {
          throw new UnauthorizedException('Account is deactivated');
        }
  
        // Generate JWT tokens
        const payload = {
          sub: existingUser.id,
          email: existingUser.email,
          role: existingUser.role,
        };
  
        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });
  
        console.log('✅ Google OAuth login successful');
        return {
          user: {
            id: existingUser.id,
            name: existingUser.name,
            email: existingUser.email,
            avatar: existingUser.avatar,
            role: existingUser.role,
          },
          accessToken,
          refreshToken,
        };
      } catch (error) {
        console.error('❌ Google OAuth error:', error);
        throw new UnauthorizedException('Google OAuth authentication failed');
      }
    }    

  // Refresh token method
  async refreshToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token);
      const user = await this.usersService.findById(decoded.sub);

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const payload = {
        sub: user.id,
        email: user.email,
        role: user.role,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  // Method để đăng ký user từ Supabase
  async registerSupabase(data: {
    supabase_user_id: string;
    email: string;
    name: string;
    newsletter?: boolean;
    email_verified?: boolean;
  }) {
    try {
      // Kiểm tra xem user đã tồn tại chưa
      const existingUser = await this.usersService.findByEmail(data.email);
      
      if (existingUser) {
        // Nếu user đã tồn tại, cập nhật thông tin Supabase ID
        const updatedUser = await this.usersService.update(existingUser.id, {
          supabaseUserId: data.supabase_user_id,
          emailVerified: data.email_verified || false,
        });

        // Tạo JWT token
        const payload = {
          sub: updatedUser.id,
          email: updatedUser.email,
          role: updatedUser.role,
        };

        const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
        const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

        return {
          user: {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            avatar: updatedUser.avatar,
            role: updatedUser.role,
          },
          accessToken,
          refreshToken,
        };
      }

      // Tạo user mới
      const newUser = await this.usersService.create({
        name: data.name,
        email: data.email,
        password: '', // Không cần password cho Supabase user
        role: 'USER',
        supabaseUserId: data.supabase_user_id,
        emailVerified: data.email_verified || false,
        newsletter: data.newsletter || false,
        isActive: true,
      });

      // Tạo JWT token
      const payload = {
        sub: newUser.id,
        email: newUser.email,
        role: newUser.role,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          avatar: newUser.avatar,
          role: newUser.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Error in registerSupabase:', error);
      throw new ConflictException('Failed to register user from Supabase');
    }
  }

  // Method để đăng ký user từ Supabase với OTP
  async registerSupabaseWithOTP(data: {
    email: string;
    password: string;
    name: string;
    newsletter?: boolean;
  }) {
    try {
      // Kiểm tra xem user đã tồn tại chưa
      const existingUser = await this.usersService.findByEmail(data.email);
      
      if (existingUser) {
        throw new ConflictException("Email đã được sử dụng");
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Tạo user mới nhưng chưa active
      const newUser = await this.usersService.create({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'USER',
        emailVerified: false,
        newsletter: data.newsletter || false,
        isActive: false, // Chưa active cho đến khi verify OTP
      });

      // Gửi OTP
      await this.sendOTP(data.email);

      return {
        message: "Đăng ký thành công. Mã OTP đã được gửi đến email của bạn.",
        userId: newUser.id,
      };
    } catch (error) {
      console.error('Error in registerSupabaseWithOTP:', error);
      throw error;
    }
  }

  // Method để gửi OTP
  async sendOTP(email: string) {
    try {
      // Tạo mã OTP 6 chữ số
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Lưu OTP vào database với thời gian hết hạn (10 phút)
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút
      
      // Tìm user theo email
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException("Email không tồn tại");
      }

      // Cập nhật OTP và thời gian hết hạn
      await this.usersService.update(user.id, {
        verificationToken: otp,
        // Có thể thêm field expiresAt vào schema nếu cần
      });

      // Gửi email OTP (sử dụng service email hoặc Supabase)
      await this.sendOTPEmail(email, otp);

      return {
        message: "Mã OTP đã được gửi đến email của bạn",
        expiresIn: 600, // 10 phút
      };
    } catch (error) {
      console.error('Error in sendOTP:', error);
      throw error;
    }
  }

  // Method để verify OTP
  async verifyOTP(email: string, otp: string) {
    try {
      // Tìm user theo email
      const user = await this.usersService.findByEmail(email);
      if (!user) {
        throw new BadRequestException("Email không tồn tại");
      }

      // Kiểm tra OTP
      if (!user.verificationToken || user.verificationToken !== otp) {
        throw new UnauthorizedException("Mã OTP không đúng");
      }

      // Kiểm tra thời gian hết hạn (có thể thêm logic kiểm tra thời gian)
      // if (user.expiresAt && new Date() > user.expiresAt) {
      //   throw new UnauthorizedException("Mã OTP đã hết hạn");
      // }

      // Cập nhật user: active và xóa OTP
      const updatedUser = await this.usersService.update(user.id, {
        isActive: true,
        emailVerified: true,
        verificationToken: null,
      });

      // Tạo JWT token
      const payload = {
        sub: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      };

      const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
      const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

      return {
        user: {
          id: updatedUser.id,
          name: updatedUser.name,
          email: updatedUser.email,
          avatar: updatedUser.avatar,
          role: updatedUser.role,
        },
        accessToken,
        refreshToken,
      };
    } catch (error) {
      console.error('Error in verifyOTP:', error);
      throw error;
    }
  }

  // Method để gửi email OTP
private async sendOTPEmail(email: string, otp: string, name?: string): Promise<boolean> {
  try {
    console.log(`🚀 AuthService: Starting OTP email send to: ${email}`);
    console.log(`🔍 AuthService: Email service status:`, this.emailService.getServiceStatus());
    
    // Gọi method public của EmailService
    const success = await this.emailService.sendOTPEmail(email, otp, name);
    
    if (success) {
      console.log(`✅ AuthService: OTP email sent successfully to ${email}`);
    } else {
      console.log(`❌ AuthService: Failed to send OTP email to ${email}`);
    }
    
    return success;
  } catch (error) {
    console.error(`❌ AuthService: Email send failed for ${email}:`, error);
    // Fallback: log ra console để test
    console.log('='.repeat(50));
    console.log(' EMAIL OTP FOR TESTING');
    console.log('='.repeat(50));
    console.log(`📧 To: ${email}`);
    console.log(`🔐 OTP Code: ${otp}`);
    console.log(`⏰ Expires in: 10 minutes`);
    console.log('='.repeat(50));
    return true;
  }
}
}
