import { Module } from '@nestjs/common';
import { WhatsappSenderController } from './whatsapp-sender.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WHATSAPP_SENDER } from 'src/service';
import { env } from 'src/config/env';
import { BulkSendService } from './bulk-send.service';
import { CampaignModule } from 'src/campaign/campaign.module';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: WHATSAPP_SENDER,
        transport: Transport.TCP,
        options: {
          host: env.BFF_WHATSAPP_SENDER_HOST,
          port: env.BFF_WHATSAPP_SENDER_PORT,
        },
      },
    ]),
    CampaignModule,
  ],
  controllers: [WhatsappSenderController],
  providers: [BulkSendService],
})
export class WhatsappSenderModule {}
