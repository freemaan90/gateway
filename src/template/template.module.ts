import { Module } from '@nestjs/common';
import { TemplateService } from './template.service';
import { TemplateController } from './template.controller';
import { PrismaService } from 'src/Database/prisma.service';
import { BillingModule } from 'src/billing/billing.module';

@Module({
  imports: [BillingModule],
  controllers: [TemplateController],
  providers: [TemplateService, PrismaService],
})
export class TemplateModule {}
