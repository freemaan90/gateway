import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { WebhookModule } from './webhook/webhook.module';
import { WhatsappSenderModule } from './whatsapp-sender/whatsapp-sender.module';
import { TemplateModule } from './template/template.module';
import { CampaignModule } from './campaign/campaign.module';
import { BillingModule } from './billing/billing.module';
import { RedisModule } from './redis/redis.module';
import { PasswordModule } from './user/password/password.module';
import { EmailModule } from './email/email.module';
import { UploadModule } from './upload/upload.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
    }),
    UserModule,
    HealthModule,
    AuthModule,
    WebhookModule,
    WhatsappSenderModule,
    TemplateModule,
    CampaignModule,
    BillingModule,
    RedisModule,
    PasswordModule,
    EmailModule,
    UploadModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


