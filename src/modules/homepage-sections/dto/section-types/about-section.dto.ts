import { IsString, IsOptional } from 'class-validator';

export class AboutSectionDto {
  @IsString()
  title: string;

  @IsString()
  title1: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  backgroundColor?: string;
} 