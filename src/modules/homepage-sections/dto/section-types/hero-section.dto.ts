import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class HeroSectionDto {
  @IsString()
  title: string;

  @IsString()
  subtitle: string;

  @IsString()
  @IsOptional()
  subtitle1?: string;

  @IsString()
  backgroundImage: string;

  @IsString()
  date: string;

  @IsString()
  location: string;

  @IsString()
  @IsOptional()
  logo?: string;

  @IsString()
  primaryButtonText: string;

  @IsBoolean()
  @IsOptional()
  showAnimations?: boolean = true;
} 