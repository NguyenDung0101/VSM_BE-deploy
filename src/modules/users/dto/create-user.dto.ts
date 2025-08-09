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
    example: true,
    description: "Whether the user is active",
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: "0912345678",
    description: "Số điện thoại người dùng",
    required: false,
  })
  @IsOptional()
  @IsString()
  phone?: string;
}