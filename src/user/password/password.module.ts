// password-reset.module.ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/Database/prisma.service';
import { RedisService } from 'src/redis/redis.service';
import { PasswordService } from './password.service';
import { PasswordController } from './password.controller';
import { EmailService } from 'src/email/email.service';

@Module({
  controllers: [PasswordController],
  providers: [PasswordService, PrismaService, RedisService,EmailService],
})
export class PasswordModule {}
