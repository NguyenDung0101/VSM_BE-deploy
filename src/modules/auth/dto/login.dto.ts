import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "admin@vsm.org.vn",
    description: "User email address",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: "password",
    description: "User password",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class GoogleLoginDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Supabase access token from Google OAuth",
  })
  @IsString()
  @IsNotEmpty()
  access_token: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    description: "Refresh token",
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}