import { IsArray, IsString, IsOptional } from 'class-validator';

export class AboutFeaturesDto {
  @IsArray()
  features: any[];

  @IsString()
  @IsOptional()
  customClasses?: string;
} 