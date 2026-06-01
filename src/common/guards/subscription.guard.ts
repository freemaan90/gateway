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

    const subscription = await this.billingService.getRawSubscription(user.id);

    if (!subscription) {
      throw new PaymentRequiredException();
    }

    if (subscription.status === SubscriptionStatus.TRIAL) {
      if (subscription.trialEndsAt && subscription.trialEndsAt < new Date()) {
        throw new PaymentRequiredException('Tu período de prueba ha expirado. Suscribite para continuar.');
      }
      return true;
    }

    if (
      subscription.status === SubscriptionStatus.CANCELED ||
      subscription.status === SubscriptionStatus.EXPIRED
    ) {
      throw new PaymentRequiredException('Tu suscripción no está activa. Revisá tu plan de facturación.');
    }

    // ACTIVE or PAST_DUE (grace period) — allow through
    return true;
  }
}
