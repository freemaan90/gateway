import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTemplateDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
  @IsString()
  @IsNotEmpty()
  content!: string;
  @IsString()
  @IsNotEmpty()
  userId!: string;
  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class UpdateTemplateDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
