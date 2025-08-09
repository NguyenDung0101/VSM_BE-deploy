import { IsArray, IsString, IsOptional } from 'class-validator';

export class StatsSectionDto {
  @IsArray()
  stats: any[];

  @IsString()
  @IsOptional()
  customClasses?: string;
}
