import { IsString, IsBoolean, IsNumber, IsOptional } from 'class-validator';

export class CreateSectionDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  component?: string;

  @IsBoolean()
  enabled: boolean = true;

  @IsNumber()
  order: number;

  @IsString()
  @IsOptional()
  authorId?: string;

  @IsString()
  type: string;

  @IsString()
  homepageId: string;

  // This will contain the specific section type data
  sectionData?: any;
}