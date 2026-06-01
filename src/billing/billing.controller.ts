import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/RolesGuard';
import { Roles } from 'src/common/decorators/Roles';
import { User, AuthUser } from 'src/common/decorators/user.decorator';
import { BillingService } from './billing.service';
import { SubscribeDto } from './dto/subscribe.dto';
import { GetInvoicesDto } from './dto/get-invoices.dto';

@Controller('billing')
@UseGuards(JwtGuard, RolesGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('plans')
  getPlans() {
    return this.billingService.getPlans();
  }

  @Get('status')
  @Roles('OWNER')
  getStatus(@User() user: AuthUser) {
    return this.billingService.getStatus(user.id);
  }

  @Post('subscribe')
  @Roles('OWNER')
  subscribe(@User() user: AuthUser, @Body() dto: SubscribeDto) {
    return this.billingService.subscribe(user.id, dto.planId, user.email);
  }

  @Delete('subscription')
  @Roles('OWNER')
  @HttpCode(HttpStatus.OK)
  cancelSubscription(@User() user: AuthUser) {
    return this.billingService.cancelSubscription(user.id);
  }

  @Get('invoices')
  @Roles('OWNER')
  getInvoices(@User() user: AuthUser, @Query() dto: GetInvoicesDto) {
    return this.billingService.getInvoices(user.id, dto.page, dto.limit);
  }

  @Post('payment-method')
  @Roles('OWNER')
  updatePaymentMethod(@User() user: AuthUser) {
    return this.billingService.updatePaymentMethod(user.id, user.email);
  }
}
