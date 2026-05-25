import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsString,
  ValidateNested,
} from 'class-validator';

export class BulkMessageItemDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}

export class BulkSendDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkMessageItemDto)
  messages: BulkMessageItemDto[];
}
