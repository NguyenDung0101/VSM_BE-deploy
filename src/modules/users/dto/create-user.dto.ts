import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
} from "class-validator";
import { Role } from "@prisma/client";

export class CreateUserDto {
  @ApiProperty({
    example: "Nguyễn Văn A",
    description: "Full name of the user",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "user@vsm.org.vn",
    description: "User email address",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "hashedpassword",
    description: "User password (hashed)",
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    example: "https://randomuser.me/api/portraits/men/3.jpg",
    description: "User avatar URL (optional, will be processed to Image model)",
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string; // Giữ trường này để nhận URL, sẽ xử lý sau

  @ApiProperty({
    enum: Role,
    example: Role.USER,
    description: "User role",
    required: false,
  })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiProperty({
    example: "google",
    description: "Authentication provider (local or google)",
    required: false,
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiProperty({
    example: true,
    description: "Whether the user is verified",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isVerified?: boolean;

  // Thêm các field cho Supabase
  @ApiProperty({
    example: "123e4567-e89b-12d3-a456-426614174000",
    description: "Supabase user ID",
    required: false,
  })
  @IsOptional()
  @IsString()
  supabaseUserId?: string;

  @ApiProperty({
    example: true,
    description: "Whether the email is verified",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  emailVerified?: boolean;

  @ApiProperty({
    example: false,
    description: "Whether the user wants to receive newsletter",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  newsletter?: boolean;

  @ApiProperty({
    example: true,
    description: "Whether the user account is active",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}