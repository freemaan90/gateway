import { Injectable, Logger } from '@nestjs/common';
import { env } from 'src/config/env';

@Injectable()
export class MetaApiService {
  private readonly logger = new Logger(MetaApiService.name);
  private readonly messagesUrl: string;

  constructor() {
    this.messagesUrl = `https://graph.facebook.com/${env.META_API_VERSION}/${env.META_PHONE_NUMBER_ID}/messages`;
  }

  getStatus() {
    return { connected: true, phoneNumberId: env.META_PHONE_NUMBER_ID };
  }

  async sendTextMessage(phone: string, message: string): Promise<{ messageId: string }> {
    const phoneClean = phone.replace(/\D/g, '');
    this.logger.log(`Sending message to ${phoneClean}`);

    const res = await fetch(this.messagesUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.META_WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: phoneClean,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg = (err as any)?.error?.message ?? `Meta API error ${res.status}`;
      this.logger.error(`Failed to send to ${phoneClean}: ${msg}`);
      throw new Error(msg);
    }

    const data = await res.json() as any;
    return { messageId: data.messages?.[0]?.id ?? '' };
  }
}
