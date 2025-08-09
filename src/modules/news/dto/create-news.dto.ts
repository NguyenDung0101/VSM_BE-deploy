import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { NewsCategory, NewsStatus } from '@prisma/client';

export class CreateNewsDto {
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  @MinLength(5, { message: 'Tiêu đề phải có ít nhất 5 ký tự' })
  @MaxLength(200, { message: 'Tiêu đề không được vượt quá 200 ký tự' })
  title: string;

  @IsNotEmpty({ message: 'Mô tả ngắn không được để trống' })
  @IsString()
  @MinLength(10, { message: 'Mô tả ngắn phải có ít nhất 10 ký tự' })
  @MaxLength(500, { message: 'Mô tả ngắn không được vượt quá 500 ký tự' })
  excerpt: string;

  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString()
  @MinLength(50, { message: 'Nội dung phải có ít nhất 50 ký tự' })
  content: string;

  @IsString()
  @IsNotEmpty({ message: 'Ảnh bìa không được để trống' })
  cover: string;

  @IsEnum(NewsCategory, { message: 'Danh mục không hợp lệ' })
  category: NewsCategory;

  @IsOptional()
  @IsEnum(NewsStatus, { message: 'Trạng thái không hợp lệ' })
  status?: NewsStatus = NewsStatus.PUBLISHED;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  readingTime?: number = 5;

  @IsOptional()
  featured?: boolean = false;
} 