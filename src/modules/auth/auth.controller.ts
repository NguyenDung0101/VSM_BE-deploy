import { Controller, Post, Body, Get, Req, UseGuards, UnauthorizedException } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { AuthService } from "./auth.service";
import { LoginDto, GoogleLoginDto, RefreshTokenDto } from "./dto/login.dto";
import { RegisterDto } from "./dto/register.dto";
import * as bcryptjs from 'bcryptjs';
import { Query } from '@nestjs/common';

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('check-account')
  async checkAccount(@Body() loginDto: LoginDto) {
    const email = loginDto.email;
    const password = loginDto.password;
    
    // Tìm user theo email
    const user = await this.authService.checkAccountExists(email);
    
    if (!user) {
      return {
        exists: false,
        message: 'Tài khoản không tồn tại',
      };
    }
    
        // Kiểm tra định dạng mật khẩu
        let hashInfo = 'Not a valid bcrypt hash';
        if (user.password && user.password.startsWith('$2')) {
          hashInfo = 'Valid bcrypt hash';
        }
        
        // Kiểm tra mật khẩu
        let passwordMatch = false;
        try {
          if (user.password) {
            passwordMatch = await bcryptjs.compare(password, user.password);
          }
        } catch (error) {
          hashInfo = `Error: ${error.message}`;
        }
    
    return {
      exists: true,
      emailFound: user.email,
      passwordHashFormat: hashInfo,
      passwordMatches: passwordMatch,
      accountActive: user.isActive,
    };
  }
  
  // Thêm endpoint reset mật khẩu tạm thời (chỉ dùng để khắc phục, nên xóa sau)
  @Post('reset-password')
  async resetPassword(@Body() data: { email: string, newPassword: string }) {
    return this.authService.resetPassword(data.email, data.newPassword);
  }

  @Post("register/self")
  async registerSelf(@Body() registerDto: RegisterDto) {
    // Self-registration: không có user hiện tại
    return this.authService.register(registerDto, null);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("register")
  async register(@Body() registerDto: RegisterDto, @Req() req) {
    // Admin registration: admin đang đăng nhập tạo tài khoản cho người khác
    return this.authService.register(registerDto, req.user);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post("create-account")
  async createAccount(@Body() registerDto: RegisterDto, @Req() req) {
    return this.authService.createAccount(registerDto, req.user);
  }

  // Endpoint để đăng ký user từ Supabase với OTP
  @Post("register-supabase")
  async registerSupabase(@Body() data: {
    email: string;
    password: string;
    name: string;
    newsletter?: boolean;
  }) {
    return this.authService.registerSupabaseWithOTP(data);
  }

  // Endpoint để gửi OTP
  @Post("send-otp")
  async sendOTP(@Body() data: { email: string }) {
    return this.authService.sendOTP(data.email);
  }

  // Endpoint để verify OTP
  @Post("verify-otp")
  async verifyOTP(@Body() data: { email: string; otp: string }) {
    return this.authService.verifyOTP(data.email, data.otp);
  }

  // Verify email by token sent via link
  @Get('verify-email')
  async verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmailToken(token);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Req() req) {
    return this.authService.getProfile(req.user.sub);
  }

  @Post("google-login")
  async googleLogin(@Body() googleLoginDto: GoogleLoginDto) {
    return this.authService.googleLogin(googleLoginDto);
  }

  @Post("refresh")
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto.refreshToken);
  }
}
