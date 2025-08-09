import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class UpdateSectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  component?: string;

  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @IsNumber()
  @IsOptional()
  order?: number;

  // This will contain the specific section type data
  sectionData?: any;
}