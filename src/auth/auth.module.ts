import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PasswordService } from 'src/user/password/password.service';
import { UserService } from 'src/user/user.service';
import { RefreshTokenStrategy } from './strategies/refresh.strategy';
import { PrismaService } from 'src/Database/prisma.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    UserService,
    RefreshTokenStrategy,
    PrismaService,
    JwtStrategy,
    RedisService,
    EmailService
  ],
})
export class AuthModule {}
