import { Module } from '@nestjs/common';
import { BillingService } from './billing.service';
import { BillingController } from './billing.controller';
import { MercadoPagoProvider } from './mercadopago.provider';
import { PrismaService } from 'src/Database/prisma.service';

@Module({
  controllers: [BillingController],
  providers: [BillingService, MercadoPagoProvider, PrismaService],
  exports: [BillingService],
})
export class BillingModule {}
