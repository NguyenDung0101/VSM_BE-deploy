import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';
import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  password?: string;

  @IsString()
  @IsOptional()
  avatar?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  verificationToken?: string | null;

  // Thêm các field cho Supabase
  @IsString()
  @IsOptional()
  supabaseUserId?: string;

  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @IsBoolean()
  @IsOptional()
  newsletter?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  // Thêm field hết hạn OTP
  @IsOptional()
  otpExpiresAt?: Date | null;
}
