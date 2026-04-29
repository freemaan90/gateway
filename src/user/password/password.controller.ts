// password-reset.controller.ts
import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { RequestResetDto, ResetPasswordDto } from '../dto/password.dto';
import { PasswordService } from './password.service';

@Controller('auth')
export class PasswordController {
  constructor(private service: PasswordService) {}

  @Post('request-password-reset')
  async requestReset(@Body() dto: RequestResetDto) {
    await this.service.requestReset(dto.email);
    return { message: 'Si el email existe, enviamos instrucciones' };
  }

  @Get('validate-reset-token')
  async validate(@Query('token') token: string) {
    const valid = await this.service.validateToken(token);
    return { valid };
  }

  @Post('reset-password')
  async reset(@Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(
      dto.token,
      dto.newPassword,
      dto.confirmPassword,
    );
  }
}
