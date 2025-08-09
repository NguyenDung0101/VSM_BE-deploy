import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateCommentDto {
  @IsNotEmpty({ message: 'Nội dung không được để trống' })
  @IsString()
  @MinLength(2, { message: 'Nội dung phải có ít nhất 2 ký tự' })
  @MaxLength(1000, { message: 'Nội dung không được vượt quá 1000 ký tự' })
  content: string;

  @IsNotEmpty({ message: 'ID bài viết không được để trống' })
  @IsUUID('4', { message: 'ID bài viết không hợp lệ' })
  newsId: string;

  @IsOptional()
  @IsUUID('4', { message: 'ID bình luận cha không hợp lệ' })
  parentId?: string;
} 