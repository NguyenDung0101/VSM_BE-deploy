import { IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SectionOrderItem {
  @IsString()
  id: string;

  @IsNumber()
  order: number;
}

export class ReorderSectionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SectionOrderItem)
  sections: SectionOrderItem[];
}