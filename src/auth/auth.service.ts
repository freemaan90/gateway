import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "src/generated/prisma/client";
import { PasswordService } from "src/user/password.service";
import { UserService } from "src/user/user.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UserService,
    private readonly jwt: JwtService,
    private readonly passwordService: PasswordService,
  ) {}

  async validateUser(email: string, pass: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) return null;

    const isMatch = await this.passwordService.compare(pass, user.password);
    return isMatch ? user : null;
  }

  async login(user: User) {
    const payload = { sub: user.id, email: user.email };

    const accessToken = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
    });

    const refreshToken = await this.jwt.signAsync(payload, {
      expiresIn: '7d',
    });

    await this.usersService.updateRefreshToken(String(user.id), refreshToken);

    return { accessToken, refreshToken };
  }
}
