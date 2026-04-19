import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { HealthModule } from './health/health.module';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { AuthModule } from './auth/auth.module';
import { WebhookModule } from './webhook/webhook.module';
import { WHATSAPP_SENDER } from './service';
import {env} from './config/env';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { WhatsappSenderModule } from './whatsapp-sender/whatsapp-sender.module';
import { TemplateModule } from './template/template.module';
import { BillingModule } from './billing/billing.module';

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
    BillingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}


