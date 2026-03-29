import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { UserService } from './user.service';
import { UserModel } from 'src/generated/prisma/models';
import { UpdateUserDto, UserCreateDto, UserResponseDto } from './dto/user.dto';
import { plainToInstance } from 'class-transformer';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('new')
  async signupUser(@Body() userData: UserCreateDto): Promise<UserModel> {
    return this.userService.createUser(userData);
  }
  @Get('all-users')
  async getUsers() {
    const users = await this.userService.findAll();
    return plainToInstance(UserResponseDto, users);
  }

  @Patch(':id')
  async patchUser(@Param('id') id: number, @Body() data: UpdateUserDto) {
    return this.userService.updateUser({
      where: { id: Number(id) },
      data,
    });
  }
}
