import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/Database/prisma.service';
import { PasswordService } from './password.service';

@Module({
  controllers: [UserController],
  providers: [UserService, PrismaService, PasswordService],
  exports: [UserService],
})
export class UserModule {}
