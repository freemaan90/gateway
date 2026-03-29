import { Body, Controller, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserModel } from 'src/generated/prisma/models';
import { UserDto } from './dto/user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('user')
  async signupUser(
    @Body() userData: UserDto,
  ): Promise<UserModel> {
    return this.userService.createUser(userData);
  }
}
