import { ApiProperty } from "@nestjs/swagger";
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  Matches,
  IsEnum,
} from "class-validator";
import { Role } from "@prisma/client"; // Giả sử Role được định nghĩa trong Prisma client

export class RegisterDto {
  @ApiProperty({
    example: "Nguyễn Văn A",
    description: "Full name of the user",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: "user@vsm.org.vn",
    description: "User email address (must end with @vsm.org.vn)",
  })
  @IsEmail()
  @IsNotEmpty()
  // @Matches(/@vsm\.org\.vn$/, { message: "Email must end with @vsm.org.vn" })
  email: string;

  @ApiProperty({
    example: "password123",
    description: "User password (minimum 6 characters)",
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: "https://randomuser.me/api/portraits/men/3.jpg",
    description: "User avatar URL",
    required: false,
  })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({
    example: "USER",
    description: "User role (ADMIN, EDITOR, or USER), set by admin only",
    required: false,
    enum: ["ADMIN", "EDITOR", "USER"],
  })
  @IsOptional()
  @IsEnum(Role, { message: "Role must be ADMIN, EDITOR, or USER" })
  role?: Role;
}