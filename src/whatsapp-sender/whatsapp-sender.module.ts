import { Module } from '@nestjs/common';
import { WhatsappSenderController } from './whatsapp-sender.controller';
import { MetaApiService } from './meta-api.service';
import { BulkSendService } from './bulk-send.service';
import { CampaignModule } from 'src/campaign/campaign.module';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [CampaignModule, BillingModule],
  controllers: [WhatsappSenderController],
  providers: [MetaApiService, BulkSendService],
})
export class WhatsappSenderModule {}
