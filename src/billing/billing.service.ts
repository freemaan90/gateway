import {
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { MercadoPagoConfig, PreApproval, PreApprovalPlan } from 'mercadopago';
import { PrismaService } from 'src/Database/prisma.service';
import { env } from 'src/config/env';
import { Subscription, SubscriptionStatus } from 'src/generated/prisma/client';
import { MP_CLIENT } from './mercadopago.provider';

const TRIAL_DAYS = 14;

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MP_CLIENT) private readonly mpClient: MercadoPagoConfig,
  ) {}

  async getPlans() {
    return this.prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
    });
  }

  async getStatus(ownerId: number) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { ownerId },
      include: { plan: true },
    });

    if (!subscription) {
      return { status: null, plan: null, trialEndsAt: null, daysRemaining: null, currentPeriodEnd: null, mpPaymentMethodId: null, mpCardLastFour: null };
    }

    let daysRemaining: number | null = null;
    if (subscription.status === SubscriptionStatus.TRIAL && subscription.trialEndsAt) {
      daysRemaining = Math.max(0, Math.ceil((subscription.trialEndsAt.getTime() - Date.now()) / 86_400_000));
    }

    return {
      status: subscription.status,
      plan: subscription.plan,
      trialEndsAt: subscription.trialEndsAt,
      daysRemaining,
      currentPeriodEnd: subscription.currentPeriodEnd,
      mpPaymentMethodId: subscription.mpPaymentMethodId,
      mpCardLastFour: subscription.mpCardLastFour,
    };
  }

  async createTrialSubscription(ownerId: number): Promise<void> {
    const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    await this.prisma.subscription.create({
      data: { ownerId, status: SubscriptionStatus.TRIAL, trialEndsAt },
    });
    this.logger.log(`Trial subscription created for owner ${ownerId}, expires ${trialEndsAt.toISOString()}`);
  }

  async subscribe(ownerId: number, planId: number, payerEmail: string): Promise<{ initPoint: string }> {
    const existing = await this.prisma.subscription.findUnique({ where: { ownerId } });
    if (existing?.mpSubscriptionId && existing.status === SubscriptionStatus.ACTIVE) {
      throw new ConflictException('Ya tenés una suscripción activa');
    }

    const plan = await this.prisma.plan.findUnique({ where: { id: planId, isActive: true } });
    if (!plan) throw new NotFoundException('Plan no encontrado');

    // Create MP plan lazily on first subscribe
    let mpPlanId = plan.mpPlanId;
    if (!mpPlanId) {
      const mpPlanClient = new PreApprovalPlan(this.mpClient);
      const mpPlan = await mpPlanClient.create({
        body: {
          reason: plan.name,
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: Number(plan.priceArs),
            currency_id: 'ARS',
          },
          back_url: env.MERCADOPAGO_SUCCESS_URL,
        },
      });
      mpPlanId = mpPlan.id!;
      await this.prisma.plan.update({ where: { id: planId }, data: { mpPlanId } });
      this.logger.log(`MP plan created for plan ${planId}: ${mpPlanId}`);
    }

    const mpPreApproval = new PreApproval(this.mpClient);
    const preApproval = await mpPreApproval.create({
      body: {
        preapproval_plan_id: mpPlanId,
        payer_email: payerEmail,
        external_reference: String(ownerId),
        back_url: env.MERCADOPAGO_SUCCESS_URL,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: Number(plan.priceArs),
          currency_id: 'ARS',
        },
      },
    });

    await this.prisma.subscription.upsert({
      where: { ownerId },
      create: {
        ownerId,
        planId,
        status: SubscriptionStatus.TRIAL,
        mpSubscriptionId: preApproval.id,
        mpPayerEmail: payerEmail,
      },
      update: {
        planId,
        mpSubscriptionId: preApproval.id,
        mpPayerEmail: payerEmail,
      },
    });

    this.logger.log(`MP preapproval created for owner ${ownerId}: ${preApproval.id}`);
    return { initPoint: preApproval.init_point! };
  }

  async cancelSubscription(ownerId: number): Promise<void> {
    const subscription = await this.prisma.subscription.findUnique({ where: { ownerId } });
    if (!subscription) throw new NotFoundException('Suscripción no encontrada');

    if (subscription.mpSubscriptionId) {
      const mpPreApproval = new PreApproval(this.mpClient);
      await mpPreApproval.update({
        id: subscription.mpSubscriptionId,
        body: { status: 'cancelled' },
      });
    }

    await this.prisma.subscription.update({
      where: { ownerId },
      data: { status: SubscriptionStatus.CANCELED, canceledAt: new Date() },
    });
    this.logger.log(`Subscription canceled for owner ${ownerId}`);
  }

  async getInvoices(ownerId: number, page: number = 1, limit: number = 10) {
    const subscription = await this.prisma.subscription.findUnique({ where: { ownerId } });
    if (!subscription) return { data: [], total: 0, page, limit };

    const [data, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where: { subscriptionId: subscription.id },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.invoice.count({ where: { subscriptionId: subscription.id } }),
    ]);

    return { data, total, page, limit };
  }

  async updatePaymentMethod(ownerId: number, payerEmail: string): Promise<{ initPoint: string }> {
    const subscription = await this.prisma.subscription.findUnique({ where: { ownerId } });
    if (!subscription?.mpSubscriptionId) {
      throw new NotFoundException('No hay suscripción activa para actualizar');
    }

    const mpPreApproval = new PreApproval(this.mpClient);
    const preApproval = await mpPreApproval.update({
      id: subscription.mpSubscriptionId,
      body: {
        back_url: env.MERCADOPAGO_SUCCESS_URL,
        payer_email: payerEmail,
      },
    });

    return { initPoint: preApproval.init_point! };
  }

  async getRawSubscription(ownerId: number): Promise<Subscription | null> {
    return this.prisma.subscription.findUnique({ where: { ownerId } });
  }

  async handleWebhookEvent(body: any): Promise<void> {
    if (body?.type !== 'preapproval' || !body?.data?.id) return;

    const mpPreApproval = new PreApproval(this.mpClient);
    let preApproval: any;
    try {
      preApproval = await mpPreApproval.get({ id: body.data.id });
    } catch {
      this.logger.warn(`Could not fetch preapproval ${body.data.id}`);
      return;
    }

    const ownerId = Number(preApproval.external_reference);
    if (!ownerId) return;

    const subscription = await this.prisma.subscription.findUnique({ where: { ownerId } });
    if (!subscription) {
      this.logger.warn(`No subscription found for owner ${ownerId}`);
      return;
    }

    const statusMap: Record<string, SubscriptionStatus> = {
      authorized: SubscriptionStatus.ACTIVE,
      active: SubscriptionStatus.ACTIVE,
      paused: SubscriptionStatus.PAST_DUE,
      cancelled: SubscriptionStatus.CANCELED,
      pending: SubscriptionStatus.TRIAL,
    };

    const newStatus = statusMap[preApproval.status] ?? subscription.status;

    const now = new Date();
    const periodEnd = preApproval.next_payment_date ? new Date(preApproval.next_payment_date) : null;

    await this.prisma.subscription.update({
      where: { ownerId },
      data: {
        status: newStatus,
        mpSubscriptionId: preApproval.id,
        mpPayerEmail: preApproval.payer_email ?? subscription.mpPayerEmail,
        currentPeriodStart: newStatus === SubscriptionStatus.ACTIVE ? now : subscription.currentPeriodStart,
        currentPeriodEnd: periodEnd ?? subscription.currentPeriodEnd,
        canceledAt: newStatus === SubscriptionStatus.CANCELED ? now : subscription.canceledAt,
      },
    });

    this.logger.log(`Subscription for owner ${ownerId} updated to ${newStatus} via webhook`);

    // Sync the most recent payment as an invoice
    if (preApproval.last_modified) {
      const summaries = preApproval.summarized;
      if (summaries?.charged_amount && subscription.planId) {
        const plan = await this.prisma.plan.findUnique({ where: { id: subscription.planId } });
        await this.prisma.invoice.upsert({
          where: { mpPaymentId: `preapproval-${preApproval.id}-${summaries.last_charged_date}` },
          create: {
            subscriptionId: subscription.id,
            status: 'PAID',
            amountArs: summaries.charged_amount,
            mpPaymentId: `preapproval-${preApproval.id}-${summaries.last_charged_date}`,
            description: plan?.name ?? 'Suscripción',
            paidAt: summaries.last_charged_date ? new Date(summaries.last_charged_date) : now,
          },
          update: {},
        });
      }
    }
  }
}
