import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { CampaignService } from './campaign.service';

@UseGuards(JwtGuard)
@Controller('campaigns')
export class CampaignController {
  constructor(private readonly campaignService: CampaignService) {}

  @Get()
  findAll(@Query('ownerId') ownerId: string) {
    return this.campaignService.findByOwner(Number(ownerId));
  }
}
