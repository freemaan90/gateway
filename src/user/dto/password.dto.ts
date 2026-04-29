import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token!: string;

  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword!: string;

  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}

export class RequestResetDto {
  @IsString()
  @IsNotEmpty()
  email!: string;
} 