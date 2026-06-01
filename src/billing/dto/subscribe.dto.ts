import { IsInt, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class SubscribeDto {
  @IsInt()
  @IsNotEmpty()
  @Type(() => Number)
  planId!: number;
}
