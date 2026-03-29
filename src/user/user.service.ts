import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/Database/prisma.service';
import { Prisma, User } from 'src/generated/prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    this.logger.log(`Buscando usuario por: ${JSON.stringify(userWhereUniqueInput)}`);

    try {
      const user = await this.prisma.user.findUnique({
        where: userWhereUniqueInput,
      });

      this.logger.log(`Usuario encontrado: ${user?.id ?? 'none'}`);
      return user;
    } catch (error) {
      this.logger.error(`Error buscando usuario`, error.stack);
      throw error;
    }
  }

  async findAll(): Promise<User[]> {
    this.logger.log('Buscando todos los usuarios');

    try {
      const users = await this.prisma.user.findMany();
      this.logger.log(`Usuarios encontrados: ${users.length}`);
      return users;
    } catch (error) {
      this.logger.error('Error buscando todos los usuarios', error.stack);
      throw error;
    }
  }

  async users(params: {
    skip?: number;
    take?: number;
    cursor?: Prisma.UserWhereUniqueInput;
    where?: Prisma.UserWhereInput;
    orderBy?: Prisma.UserOrderByWithRelationInput;
  }): Promise<User[]> {
    this.logger.log(`Buscando usuarios con filtros: ${JSON.stringify(params)}`);

    try {
      const users = await this.prisma.user.findMany(params);
      this.logger.log(`Usuarios encontrados: ${users.length}`);
      return users;
    } catch (error) {
      this.logger.error('Error buscando usuarios con filtros', error.stack);
      throw error;
    }
  }

  async createUser(data: Prisma.UserCreateInput): Promise<User> {
    this.logger.log(`Creando usuario con email: ${data.email}`);

    try {
      const user = await this.prisma.user.create({
        data,
      });

      this.logger.log(`Usuario creado con ID: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error creando usuario`, error.stack);
      throw error;
    }
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    this.logger.log(
      `Actualizando usuario ${JSON.stringify(params.where)} con data: ${JSON.stringify(params.data)}`,
    );

    try {
      const user = await this.prisma.user.update(params);
      this.logger.log(`Usuario actualizado: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error actualizando usuario`, error.stack);
      throw error;
    }
  }

  async deleteUser(where: Prisma.UserWhereUniqueInput): Promise<User> {
    this.logger.log(`Eliminando usuario: ${JSON.stringify(where)}`);

    try {
      const user = await this.prisma.user.delete({ where });
      this.logger.log(`Usuario eliminado: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Error eliminando usuario`, error.stack);
      throw error;
    }
  }
}