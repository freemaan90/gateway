import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { User } from 'src/generated/prisma/client';
import { PasswordService } from 'src/user/password/password.service';
import { UserService } from 'src/user/user.service';
import { Role } from 'src/enum/Roles';
import { BillingService } from 'src/billing/billing.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwt: JwtService,
    private readonly passwordService: PasswordService,
    private readonly billingService: BillingService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isMatch = await this.passwordService.compare(pass, user.password);
    return isMatch ? user : null;
  }

  async register(data: {
    name: string;
    lastName: string;
    phone: string;
    email: string;
    password: string;
    company: string;
    companyLogo?: string;
  }): Promise<User> {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) {
      throw new ConflictException('Ya existe un usuario con ese email');
    }

    const hashedPassword = await this.passwordService.hash(data.password);

    const user = await this.usersService.createOwner({
      ...data,
      password: hashedPassword,
      role: Role.OWNER,
    });

    await this.billingService.createTrialSubscription(user.id);

    return user;
  }

  async login(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      ownerId: user.ownerId,
      company: user.company,
      companyLogo: user.companyLogo,
    };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
    });

    await this.usersService.updateRefreshToken(String(user.id), refreshToken);

    return { accessToken, refreshToken };
  }

  async getProfile(userId: number) {
    return this.usersService.findById(userId);
  }
}
