import { IsString, IsBoolean, IsOptional, IsInt } from 'class-validator';

export class NewsSectionDto {
  @IsString()
  title: string;

  @IsString()
  title1: string;

  @IsString()
  description: string;

  @IsInt()
  @IsOptional()
  postsPerRow?: number = 3;

  @IsBoolean()
  @IsOptional()
  showViewAllButton?: boolean = true;
} 