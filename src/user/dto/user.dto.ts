import { Exclude } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class UserCreateDto {
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
  @IsString()
  @IsNotEmpty()
  password: string;

    constructor(partial: Partial<UserCreateDto>) {
    Object.assign(this, partial);
  }
}

export class UserResponseDto {
  id: number;
  name: string;
  email: string;
  lastName: string;
  phone: string;

  @Exclude()
  password: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}
