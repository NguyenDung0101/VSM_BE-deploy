import { IsString, IsInt, IsOptional } from 'class-validator';

export class TeamSectionDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsInt()
  @IsOptional()
  membersPerRow?: number = 4;
}
