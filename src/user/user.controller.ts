import { Body, Controller, Get, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserModel } from 'src/generated/prisma/models';
import { UserDto } from './dto/user.dto';
import { plainToInstance } from 'class-transformer';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('user')
  async signupUser(
    @Body() userData: UserDto,
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }
  @Get('all-users')
  async getUsers(){
   const users = await this.userService.findAll();
  return plainToInstance(UserDto, users);
  }
}
