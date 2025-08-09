import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { GalleryCategory } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGalleryImageDto {
  @ApiProperty({ description: 'Đường dẫn ảnh' })
  @IsNotEmpty({ message: 'Đường dẫn ảnh không được để trống' })
  @IsString()
  src: string;

  @ApiProperty({ description: 'Tiêu đề ảnh' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Tên sự kiện' })
  @IsNotEmpty({ message: 'Tên sự kiện không được để trống' })
  @IsString()
  event: string;

  @ApiProperty({ description: 'Địa điểm' })
  @IsNotEmpty({ message: 'Địa điểm không được để trống' })
  @IsString()
  location: string;

  @ApiProperty({ description: 'Năm diễn ra' })
  @IsNotEmpty({ message: 'Năm không được để trống' })
  @IsNumber()
  @Min(1900, { message: 'Năm không hợp lệ' })
  year: number;

  @ApiProperty({ description: 'Danh mục', enum: GalleryCategory })
  @IsEnum(GalleryCategory, { message: 'Danh mục không hợp lệ' })
  category: GalleryCategory;

  @ApiProperty({ description: 'Mô tả', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Số lượng người tham gia', required: false })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Số lượng người tham gia không hợp lệ' })
  participants?: number;

  @ApiProperty({ description: 'ID của sự kiện liên quan', required: false })
  @IsOptional()
  @IsString()
  eventId?: string;
} 