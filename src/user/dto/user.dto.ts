import { Exclude } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/enum/Roles';

export class UserCreateDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsNotEmpty()
  email!: string;
  @IsString()
  @IsNotEmpty()
  lastName!: string;
  @IsString()
  @IsNotEmpty()
  phone!: string;
  @IsString()
  @IsNotEmpty()
  password!: string;
  @IsEnum(Role)
  @IsOptional()
  role?: Role = Role.EMPLOYEE;

  constructor(partial: Partial<UserCreateDto>) {
    Object.assign(this, partial);
  }
}

export class UserResponseDto {
  @IsNumber()
  @IsNotEmpty()
  id!: number;
  @IsString()
  @IsNotEmpty()
  name!: string;
  @IsString()
  @IsNotEmpty()
  email!: string;
  @IsString()
  @IsNotEmpty()
  lastName!: string;
  @IsString()
  @IsNotEmpty()
  phone!: string;
  @IsEnum(Role)
  @IsNotEmpty()
  role!: Role;

  @Exclude()
  password!: string;

  constructor(partial: Partial<UserResponseDto>) {
    Object.assign(this, partial);
  }
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  password?: string;
  
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  constructor(partial: Partial<UpdateUserDto>) {
    Object.assign(this, partial);
  }
}
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty()
  email!: string;
  @IsString()
  @IsNotEmpty()
  newPassword!: string;
}
