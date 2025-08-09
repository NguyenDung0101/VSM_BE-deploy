import { IsString, IsOptional } from 'class-validator';

export class CountdownTimerDto {
  @IsString()
  eventDate: string;

  @IsString()
  @IsOptional()
  customClasses?: string;
} 