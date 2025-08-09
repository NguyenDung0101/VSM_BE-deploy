import { IsNotEmpty, IsString } from 'class-validator';

export class CreateHomepageDto {
  @IsNotEmpty()
  @IsString()
  name: string;
} 