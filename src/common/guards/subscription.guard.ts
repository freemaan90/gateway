import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { BillingService } from 'src/billing/billing.service';
import { Role } from 'src/enum/Roles';
import { SubscriptionStatus } from 'src/generated/prisma/client';
import { PaymentRequiredException } from 'src/common/exceptions/payment-required.exception';
import type { AuthUser } from 'src/common/decorators/user.decorator';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly billingService: BillingService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user: AuthUser | undefined = request.user;

    if (!user || user.role !== Role.OWNER) return true;

    // Use getStatus() to trigger the trial→free auto-downgrade before checking
    const { status } = await this.billingService.getStatus(user.id);

    if (!status) {
      throw new PaymentRequiredException();
    }

    if (
      status === SubscriptionStatus.CANCELED ||
      status === SubscriptionStatus.EXPIRED
    ) {
      throw new PaymentRequiredException('Tu suscripción no está activa. Revisá tu plan de facturación.');
    }

    // TRIAL (active), ACTIVE, or PAST_DUE (grace period) — allow through
    return true;
  }
}
