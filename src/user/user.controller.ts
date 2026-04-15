import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { UserService } from './user.service';
import { UserModel } from 'src/generated/prisma/models';
import {
  ChangePasswordDto,
  UpdateUserDto,
  UserCreateDto,
  UserResponseDto,
} from './dto/user.dto';
import { plainToInstance } from 'class-transformer';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Post('new')
  async signupUser(@Body() userData: UserCreateDto): Promise<UserModel> {
    return this.userService.createUser(userData);
  }
  @Get(`:id`)
  async getUser(@Param(`id`) id: string) {
    return this.userService.user({ id: Number(id) });
  }
  @Get('all-users')
  async getUsers() {
    const users = await this.userService.findAll();
    return plainToInstance(UserResponseDto, users);
  }

  @Patch('reset-password')
  async resetPassword(@Body() body: ChangePasswordDto) {
    return this.userService.resetPassword(body.email, body.newPassword);
  }

  @Patch(':id/change-password')
  async changePassword(
    @Param('id') id: number,
    @Body() body: { currentPassword: string; newPassword: string },
  ) {
    return this.userService.changePassword(
      Number(id),
      body.currentPassword,
      body.newPassword,
    );
  }

  @Patch(':id')
  async patchUser(@Param('id') id: number, @Body() data: UpdateUserDto) {
    return this.userService.updateUser({
      where: { id: Number(id) },
      data,
    });
  }

  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    return this.userService.deleteUser({ id: Number(id) });
  }
}
