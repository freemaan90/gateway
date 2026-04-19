import { IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class RegisterDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() lastName!: string;
  @IsString() @IsNotEmpty() phone!: string;
  @IsEmail() @IsNotEmpty() email!: string;
  @IsString() @IsNotEmpty() password!: string;
  @IsString() @IsNotEmpty() company!: string;
  @IsString() @IsOptional() companyLogo!: string;
}