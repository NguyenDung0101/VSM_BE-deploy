import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class EventsSectionDto {
  @IsString()
  title: string;

  @IsString()
  title1: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsBoolean()
  @IsOptional()
  showViewAllButton?: boolean = true;
}
