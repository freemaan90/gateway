import { BadRequestException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { PrismaService } from 'src/Database/prisma.service';
import { EmailService } from 'src/email/email.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class PasswordService {
  private TOKEN_TTL = 60 * 15; // 15 minutos
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private email: EmailService,
  ) {}
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  async compare(password: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(password, hashed);
  }

  async requestReset(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Siempre devolver 200 aunque no exista
    if (!user) return;

    const token = randomUUID();

    await this.redis.set(
      `password-reset:${token}`,
      user.id.toString(),
      this.TOKEN_TTL,
    );

    // Aquí enviarías el email real
    await this.email.sendPasswordResetEmail({
      to: email,
      token,
      tenantName: user.company,
      tenantLogo: user.companyLogo,
    });

    return;
  }

  async validateToken(token: string) {
    const userId = await this.redis.get(`password-reset:${token}`);
    return !!userId;
  }

  async resetPassword(
    token: string,
    newPassword: string,
    confirmPassword: string,
  ) {
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const userId = await this.redis.get(`password-reset:${token}`);

    if (!userId) {
      throw new BadRequestException('Token inválido o expirado');
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: Number(userId) },
      data: { password: hashed },
    });

    await this.redis.del(`password-reset:${token}`);

    return { message: 'Contraseña actualizada correctamente' };
  }
}
