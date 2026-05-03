import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from 'src/enum/Roles';

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  ownerId: number | null;
  company: string | null;
  companyLogo: string | null;
}

export const User = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthUser => {
    const request = ctx.switchToHttp().getRequest();
    return request.user; // 👈 lo que tu JwtGuard inyecta
  },
);
