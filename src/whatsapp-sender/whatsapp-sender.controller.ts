import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { RolesGuard } from 'src/common/guards/RolesGuard';
import { SubscriptionGuard } from 'src/common/guards/subscription.guard';
import { AuthUser, User } from 'src/common/decorators/user.decorator';
import { MetaApiService } from './meta-api.service';
import { BulkSendService } from './bulk-send.service';
import { BulkSendDto } from './dtos/bulk-send.dto';
import { SendMessageDto } from './dtos/send-message.dto';

@Controller('whatsapp-sender')
@UseGuards(JwtGuard, RolesGuard, SubscriptionGuard)
export class WhatsappSenderController {
  private readonly logger = new Logger(WhatsappSenderController.name);

  constructor(
    private readonly metaApiService: MetaApiService,
    private readonly bulkSendService: BulkSendService,
  ) {}

  @Get('status')
  getStatus() {
    return this.metaApiService.getStatus();
  }

  @Post('send')
  async sendMessage(@Body() body: SendMessageDto) {
    return this.metaApiService.sendTextMessage(body.phone, body.message);
  }

  @Post('bulk-send')
  @HttpCode(202)
  async bulkSend(@Body() body: BulkSendDto, @User() user: AuthUser) {
    const jobId = this.bulkSendService.createJob(body.messages, user.id, body.templateTitle);
    return { jobId };
  }

  @Get('bulk-send/:jobId')
  async getBulkSendStatus(@Param('jobId') jobId: string) {
    const job = this.bulkSendService.getJob(jobId);
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    return job;
  }
}
