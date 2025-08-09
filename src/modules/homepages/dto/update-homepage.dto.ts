import { PartialType } from '@nestjs/mapped-types';
import { CreateHomepageDto } from './create-homepage.dto';

export class UpdateHomepageDto extends PartialType(CreateHomepageDto) {} 