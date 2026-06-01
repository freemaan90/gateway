import { Module } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { WebhookController } from './webhook.controller';
import { ConfigModule } from '@nestjs/config';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), BillingModule],
  controllers: [WebhookController],
  providers: [WebhookService],
})
export class WebhookModule {}
