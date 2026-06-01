import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { PrismaService } from 'src/Database/prisma.service';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [CampaignController],
  providers: [CampaignService, PrismaService],
  exports: [CampaignService],
})
export class CampaignModule {}
