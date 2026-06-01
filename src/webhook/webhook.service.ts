import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WebhookSignatureValidator, InvalidWebhookSignatureError, MercadoPagoConfig } from 'mercadopago';
import { BillingService } from 'src/billing/billing.service';
import { env } from 'src/config/env';

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name);

  constructor(
    private config: ConfigService,
    private readonly billingService: BillingService,
  ) {}

  verifyWebhook(query: {
    'hub.mode'?: string;
    'hub.verify_token'?: string;
    'hub.challenge'?: string;
  }): string | null {
    const verifyToken = this.config.get<string>('VERIFY_TOKEN') ;
    if (
      query['hub.mode'] === 'subscribe' &&
      query['hub.verify_token'] === verifyToken
    ) {
      return query['hub.challenge'] ?? '';
    }
    return null;
  }

  async handleMercadoPagoEvent(body: any, xSignature: string, xRequestId: string): Promise<void> {
    try {
      WebhookSignatureValidator.validate({
        xSignature,
        xRequestId,
        dataId: body?.data?.id,
        secret: env.MERCADOPAGO_WEBHOOK_SECRET,
      });
    } catch (err) {
      if (err instanceof InvalidWebhookSignatureError) {
        this.logger.warn(`Invalid MercadoPago webhook signature: ${err.message}`);
        return; // silently discard invalid signatures
      }
      throw err;
    }

    try {
      await this.billingService.handleWebhookEvent(body);
    } catch (error) {
      this.logger.warn(`Error processing MercadoPago event: ${error?.message ?? error}`);
    }
  }

  async handleWebhookEvent(body: any): Promise<void> {
    try {
      // Validate basic Meta webhook structure
      if (!body?.object || !Array.isArray(body?.entry)) {
        this.logger.warn('Received invalid Meta webhook payload — ignoring');
        return;
      }

      // Extract status updates from the payload
      for (const entry of body.entry) {
        for (const change of entry?.changes ?? []) {
          const statuses = change?.value?.statuses ?? [];
          for (const status of statuses) {
            const wamid: string | undefined = status?.id;
            const statusValue: string | undefined = status?.status;

            if (wamid && statusValue) {
              this.logger.log(
                `Webhook: updated delivery status for wamid=${wamid} status=${statusValue}`,
              );
            }
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `Failed to process webhook event: ${error?.message ?? error}`,
      );
      // Do not rethrow — always return 200 to Meta
    }
  }
}
