import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/RolesGuard';
import { SubscriptionGuard } from 'src/common/guards/subscription.guard';
import { CampaignService } from './campaign.service';

@UseGuards(JwtGuard, RolesGuard, SubscriptionGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  findAll(@Query('ownerId') ownerId: string) {
    return this.campaignService.findByOwner(Number(ownerId));
  }
}
