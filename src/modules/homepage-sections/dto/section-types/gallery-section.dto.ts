import { IsString, IsBoolean, IsOptional } from 'class-validator';

export class GallerySectionDto {
  @IsString()
  title: string;

  @IsBoolean()
  @IsOptional()
  autoPlay?: boolean = false;

  @IsBoolean()
  @IsOptional()
  showControls?: boolean = true;
}
