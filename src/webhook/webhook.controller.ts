import { Body, Controller, ForbiddenException, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import { WebhookService } from './webhook.service';

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  verifyWebhook(@Query() query: Record<string, string>): string {
    const challenge = this.webhookService.verifyWebhook(query);
    if (challenge === null) {
      throw new ForbiddenException('Invalid webhook verification token');
    }
    return challenge;
  }

  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: any): Promise<{ status: string }> {
    await this.webhookService.handleWebhookEvent(body);
    return { status: 'ok' };
  }
}
