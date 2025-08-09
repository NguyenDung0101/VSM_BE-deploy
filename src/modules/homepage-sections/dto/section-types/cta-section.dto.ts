import { IsString, IsOptional } from 'class-validator';

export class CTASectionDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  buttonText: string;

  @IsString()
  @IsOptional()
  backgroundColor?: string;
} 