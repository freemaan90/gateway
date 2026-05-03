import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import {
  ChangePasswordDto,
  UpdateUserDto,
  UserCreateDto,
  UserResponseDto,
} from './dto/user.dto';
import { plainToInstance } from 'class-transformer';
import { Roles } from 'src/common/decorators/Roles';
import { User } from 'src/common/decorators/user.decorator';
import type { AuthUser } from 'src/common/decorators/user.decorator';
import { Role } from 'src/enum/Roles';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/RolesGuard';

@Controller('user')
export class UserController {
  private readonly logger = new Logger('User');

  constructor(private readonly userService: UserService) {}

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.OWNER, Role.SUPERVISOR)
  @Post('new')
  createUser(@User() user: AuthUser, @Body() dto: UserCreateDto) {
    return this.userService.createUser(user, dto);
  }

  @UseGuards(JwtGuard, RolesGuard)
  @Roles(Role.OWNER, Role.SUPERVISOR)
  @Post('new-employee')
  createEmployee(@User() user: AuthUser, @Body() dto: UserCreateDto) {
    return this.userService.createUser(user, dto);
  }

  @Get('all-users')
  async getUsers() {
    this.logger.log('Obteniendo todos los usuarios');
    const users = await this.userService.findAll();
    return plainToInstance(UserResponseDto, users);
  }

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const parsedId = Number(id);

    if (isNaN(parsedId)) {
      throw new BadRequestException('El ID debe ser un número válido');
    }

    return this.userService.user({ id: parsedId });
  }

  @Get(`employees/:id`)
  async getEmployees(@Param(`id`) ownerId: string) {
    return this.userService.findEmployees(Number(ownerId));
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
