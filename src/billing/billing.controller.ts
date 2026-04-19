import { Controller, Get } from '@nestjs/common';
import { BillingService } from './billing.service';
import { Roles } from 'src/common/decorators/Roles';

@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('billing')
  @Roles('OWNER')
  getBillingStatus() {
    return this.billingService.getStatus();
  }
}
