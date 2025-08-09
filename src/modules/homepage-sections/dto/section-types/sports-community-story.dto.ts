import { IsString, IsOptional } from 'class-validator';

export class SportsCommunityStoryDto {
  @IsString()
  subtitle: string;

  @IsString()
  title: string;

  @IsString()
  paragraph1: string;

  @IsString()
  paragraph2: string;

  @IsString()
  paragraph3: string;

  @IsString()
  paragraph4: string;

  @IsString()
  image: string;

  @IsString()
  statsValue: string;

  @IsString()
  statsLabel: string;

  @IsString()
  @IsOptional()
  customClasses?: string;
} 