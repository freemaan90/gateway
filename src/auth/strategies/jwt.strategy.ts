import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => {
          // Leer token desde cookie
          return req.cookies?.access_token || null;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: any) {
    console.log('JWT Payload:', payload); // <-- LOG PAYLOAD
    return {
      id: payload.sub, // ✔️ id correcto
      email: payload.email,
      role: payload.role,
      ownerId: payload.ownerId, // ✔️ usar el valor real del JWT
      company: payload.company, // ✔️ agregar
      companyLogo: payload.companyLogo, // ✔️ agregar
    };
  }
}
