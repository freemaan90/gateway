import {
  Controller,
  Post,
  Get,
  Req,
  Res,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtGuard } from './guards/jwt.guard';
import { RefreshGuard } from './guards/refresh.guard';
import type { CookieOptions, Response } from 'express';
import { LoginDto } from './dtos/login.dto';
import { env } from 'src/config/env';
import { RegisterDto } from './dtos/register.dto';
import { User } from 'src/common/decorators/user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // REGISTER (público — crea OWNERs)
  @Post('register')
  @HttpCode(201)
  async register(@Body() body: RegisterDto) {
    return this.authService.register(body);
  }

  // LOGIN
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() body: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const user = await this.authService.validateUser(body.email, body.password);
    if (!user) return { message: 'Invalid credentials' };

    const tokens = await this.authService.login(user);

    this.setAuthCookies(res, tokens);

    return { message: 'Logged in successfully' };
  }

  // REFRESH
  @UseGuards(RefreshGuard)
  @Get('refresh')
  async refresh(@Req() req, @Res({ passthrough: true }) res: Response) {
    const user = req.user;

    const tokens = await this.authService.login(user);

    this.setAuthCookies(res, tokens);

    return { message: 'Tokens refreshed' };
  }

  // LOGOUT
  @Post('logout')
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');

    return { message: 'Logged out' };
  }

  // PROFILE
  @UseGuards(JwtGuard)
  @Get('me')
  async me(@User() user: { id: number }) {
    return this.authService.getProfile(user.id);
  }

  // Helper interno para no repetir cookies
  private setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string },
  ) {
    const isProd = env.nodeEnv === 'production';

    const cookieOptions: CookieOptions = {
      httpOnly: true,
      secure: isProd,
      sameSite: (isProd ? 'lax' : 'none') as 'lax' | 'none',
      path: '/',
    };

    res.cookie('access_token', tokens.accessToken, cookieOptions);
    res.cookie('refresh_token', tokens.refreshToken, cookieOptions);
  }
}
