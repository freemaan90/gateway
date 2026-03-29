import { Injectable, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { UserService } from 'src/user/user.service';
import { PasswordService } from 'src/user/password.service';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private userService: UserService,
    private passwordService: PasswordService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          // 1) Refresh token desde cookie
          if (req.cookies?.refresh_token) {
            return req.cookies.refresh_token;
          }

          // 2) Refresh token desde header Authorization
          const authHeader = req.headers.authorization;
          if (authHeader?.startsWith('Bearer ')) {
            return authHeader.split(' ')[1];
          }

          return null;
        },
      ]),
      secretOrKey: process.env.JWT_REFRESH_SECRET,
      passReqToCallback: true,
    });
  }

  async validate(req: Request, payload: any) {
    const refreshToken =
      req.cookies?.refresh_token ||
      req.headers.authorization?.replace('Bearer ', '');

    if (!refreshToken) {
      throw new ForbiddenException('Refresh token missing');
    }

    const user = await this.userService.user({ id: payload.sub });

    if (!user || !user.refreshToken) {
      throw new ForbiddenException('User not found or no refresh token stored');
    }

    const isValid = await this.passwordService.compare(
      refreshToken,
      user.refreshToken,
    );

    if (!isValid) {
      throw new ForbiddenException('Invalid refresh token');
    }

    return user;
  }
}
