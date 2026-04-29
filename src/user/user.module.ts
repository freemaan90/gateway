import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/Database/prisma.service';
import { PasswordService } from './password/password.service';
import { RedisService } from 'src/redis/redis.service';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, PasswordService, RedisService,EmailService],
  exports: [UserService],
})
export class UserModule {}
