import { IsString, IsEmail, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ExperienceLevel } from '@prisma/client';

export class RegisterEventDto {
  @IsString()
  @MinLength(2, { message: 'Họ tên phải có ít nhất 2 ký tự' })
  fullName: string;

  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString()
  @MinLength(10, { message: 'Số điện thoại phải có ít nhất 10 ký tự' })
  phone: string;

  @IsString()
  @MinLength(2, { message: 'Thông tin liên hệ khẩn cấp không được để trống' })
  emergencyContact: string;

  @IsOptional()
  @IsString()
  emergencyPhone?: string;

  @IsOptional()
  @IsString()
  medicalConditions?: string;

  @IsEnum(ExperienceLevel, { message: 'Trình độ kinh nghiệm không hợp lệ' })
  experience: ExperienceLevel;
}
