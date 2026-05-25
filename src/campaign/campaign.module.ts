import { Module } from '@nestjs/common';
import { CampaignService } from './campaign.service';
import { CampaignController } from './campaign.controller';
import { PrismaService } from 'src/Database/prisma.service';

@Module({
  controllers: [CampaignController],
  providers: [CampaignService, PrismaService],
  exports: [CampaignService],
})
export class CampaignModule {}
