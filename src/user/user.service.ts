import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/Database/prisma.service';
import { Prisma, User } from 'src/generated/prisma/client';
import { PasswordService } from './password.service';
import { Role } from 'src/enum/Roles';
@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private prisma: PrismaService,
    private passwordService: PasswordService,
  ) {}

  async user(
    userWhereUniqueInput: Prisma.UserWhereUniqueInput,
  ): Promise<User | null> {
    this.logger.log(
      `Buscando usuario por: ${JSON.stringify(userWhereUniqueInput)}`,
    );

    try {
      const user = await this.prisma.user.findUnique({
        where: userWhereUniqueInput,
      });

      this.logger.log(`Usuario encontrado: ${user?.id ?? 'none'}`);
      return user;
    } catch (error: any) {
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
    } catch (error: any) {
      this.logger.error('Error buscando todos los usuarios', error.stack);
      throw error;
    }
  }

  async findByEmail(email: string) {
    this.logger.log(`Buscando usuario con email: ${email}`);
    try {
      const user = await this.prisma.user.findFirst({
        where: {
          email,
        },
      });

      if (!user) {
        this.logger.log(`Usuario no encontrado encontrado con email: ${email}`);
        return null;
      }

      this.logger.log(`Usuario encontrado con email: ${user.email}`);

      return user;
    } catch (error: any) {
      this.logger.error(`Error buscando usuario`, error.stack);
    }
  }

  async createOwner(data: {
    name: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    role: Role;
  }): Promise<User> {
    this.logger.log(`Registrando nuevo OWNER con email: ${data.email}`);

    try {
      const user = await this.prisma.user.create({
        data: {
          ...data,
          ownerId: null,
        },
      });

      this.logger.log(`OWNER creado con ID: ${user.id}`);
      return user;
    } catch (error: any) {
      this.logger.error(`Error registrando OWNER`, error.stack);
      throw error;
    }
  }

  async createUser(creator: User, data: Prisma.UserUncheckedCreateInput): Promise<User> {
    this.logger.log(`Creando usuario con email: ${data.email}`);

    try {
      // 1. Validar permisos
      if (creator.role === Role.EMPLOYEE) {
        throw new Error('No tenés permisos para crear usuarios');
      }

      // 2. Determinar ownerId
      let ownerId: number | null = null;

      if (creator.role === Role.OWNER) {
        // Owner crea usuarios para su tenant
        ownerId = creator.id;
      }

      if (creator.role === Role.SUPERVISOR) {
        // Supervisor solo puede crear empleados
        if (data.role !== Role.EMPLOYEE) {
          throw new Error('Un supervisor solo puede crear empleados');
        }
        ownerId = creator.ownerId!;
      }

      // 3. Hashear password
      const hashedPassword = await this.passwordService.hash(data.password);

      // 4. Crear usuario
      const user = await this.prisma.user.create({
        data: {
          ...data,
          password: hashedPassword,
          role: data.role ?? Role.EMPLOYEE,
          ownerId,
        },
      });

      this.logger.log(`Usuario creado con ID: ${user.id}`);
      return user;
    } catch (error: any) {
      this.logger.error(`Error creando usuario`, error.stack);
      throw error;
    }
  }

  async updateUser(params: {
    where: Prisma.UserWhereUniqueInput;
    data: Prisma.UserUpdateInput;
  }): Promise<User> {
    this.logger.log(`Actualizando usuario ${JSON.stringify(params.where)}`);

    try {
      const { data, where } = params;

      // Si viene password, lo hasheamos
      if (data.password) {
        const hashedPassword = await this.passwordService.hash(
          data.password as string,
        );

        data.password = hashedPassword; // Sobrescribimos el valor plano
      }

      const user = await this.prisma.user.update({
        where,
        data,
      });

      this.logger.log(`Usuario actualizado: ${user.id}`);
      return user;
    } catch (error: any) {
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
    } catch (error: any) {
      this.logger.error(`Error eliminando usuario`, error.stack);
      throw error;
    }
  }
  async updateRefreshToken(userId: string, refreshToken: string) {
    this.logger.log(`Actualizando refresh token para usuario: ${userId}`);

    try {
      const hashedToken = await this.passwordService.hash(refreshToken);

      const user = await this.prisma.user.update({
        where: { id: Number(userId) },
        data: {
          refreshToken: hashedToken,
        },
      });

      this.logger.log(`Refresh token actualizado para usuario: ${user.id}`);
      return user;
    } catch (error: any) {
      this.logger.error(
        `Error actualizando refresh token para usuario ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  async removeRefreshToken(userId: string) {
    this.logger.log(`Removiendo refresh token para usuario: ${userId}`);

    try {
      const user = await this.prisma.user.update({
        where: { id: Number(userId) },
        data: {
          refreshToken: null,
        },
      });

      this.logger.log(`Refresh token removido para usuario: ${user.id}`);
      return user;
    } catch (error: any) {
      this.logger.error(
        `Error removiendo refresh token para usuario ${userId}`,
        error.stack,
      );
      throw error;
    }
  }

  async changePassword(
    userId: number,
    currentPassword: string,
    newPassword: string,
  ) {
    this.logger.log(`Intentando cambiar contraseña del usuario ${userId}`);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    // Validar contraseña actual
    const isValid = await this.passwordService.compare(
      currentPassword,
      user.password,
    );

    if (!isValid) {
      throw new Error('La contraseña actual es incorrecta');
    }

    // Hashear nueva contraseña
    const hashedPassword = await this.passwordService.hash(newPassword);

    // Actualizar
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    this.logger.log(`Contraseña actualizada para usuario ${userId}`);

    return { message: 'Contraseña actualizada correctamente' };
  }

  async resetPassword(email: string, newPassword: string) {
    this.logger.log(`Intentando resetear contraseña para ${email}`);

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('No existe un usuario con ese email');
    }

    const hashedPassword = await this.passwordService.hash(newPassword);

    await this.prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    this.logger.log(`Contraseña reseteada para ${email}`);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
