import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  name: string;
  @IsString()
  @IsNotEmpty()
  email: string;
  @IsString()
  @IsNotEmpty()
  lastName: string;
  @IsString()
  @IsNotEmpty()
  phone: string;
  @Exclude()
  @IsString()
  @IsNotEmpty()
  password: string;

    constructor(partial: Partial<UserDto>) {
    Object.assign(this, partial);
  }
}
