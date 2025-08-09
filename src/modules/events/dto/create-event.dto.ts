// src/events/dto/create-event.dto.ts
import { IsString, IsInt, IsDateString, IsEnum, IsOptional, IsBoolean } from 'class-validator';
import { EventCategory, EventStatus } from '@prisma/client';

export class CreateEventDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsString()
  content: string;

  @IsDateString()
  date: string;

  @IsString()
  location: string;

  @IsInt()
  maxParticipants: number;

  @IsEnum(EventCategory)
  category: EventCategory;

  @IsEnum(EventStatus)
  @IsOptional()
  status?: EventStatus;

  @IsOptional()
  @IsString()
  distance?: string;

  @IsOptional()
  @IsInt()
  registrationFee?: number;

  @IsOptional()
  @IsString()
  requirements?: string;

  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @IsOptional()
  @IsBoolean()
  featured?: boolean;

  @IsOptional()
  @IsDateString()
  registrationDeadline?: string;

  @IsOptional()
  @IsString()
  organizer?: string;
}