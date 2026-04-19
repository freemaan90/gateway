import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
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
import { Roles } from 'src/common/decorators/Roles';
import { Role } from 'src/enum/Roles';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/RolesGuard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

@UseGuards(JwtGuard, RolesGuard)
@Roles(Role.OWNER, Role.SUPERVISOR)
@Post('new')
createUser(@Req() req, @Body() dto: UserCreateDto) {
  console.log('REQ USER:', req.user);
  return this.userService.createUser(req.user, dto);
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
