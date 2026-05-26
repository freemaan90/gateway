import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, retry } from 'rxjs';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { AuthUser, User } from 'src/common/decorators/user.decorator';
import { WHATSAPP_SENDER } from 'src/service';
import { BulkSendService } from './bulk-send.service';
import { BulkSendDto } from './dtos/bulk-send.dto';
import { CreateSessionDto } from './dtos/create-session.dto';
import { SendMessageDto } from './dtos/send-message.dto';

@Controller('whatsapp-sender')
export class WhatsappSenderController {
  private readonly logger = new Logger(WhatsappSenderController.name);

  constructor(
    @Inject(WHATSAPP_SENDER)
    private readonly whatsappSenderClient: ClientProxy,
    private readonly bulkSendService: BulkSendService,
  ) {}

  @Get('health')
  async whatsAppSenderHealth() {
    this.logger.log(`Health check for WhatsApp Sender`);

    try {
      const result = await firstValueFrom(
        this.whatsappSenderClient
          .send({ cmd: 'whatsapp_sender_health' }, {})
          .pipe(
            retry(3),
            catchError((error) => {
              this.logger.error(`Health check failed: ${error.message}`);
              throw error;
            }),
          ),
      );

      this.logger.log(`Health check OK`);
      return result;
    } catch (error) {
      throw new ServiceUnavailableException({
        status: 'down',
        service: 'whatsapp-sender',
      });
    }
  }

  @UseGuards(JwtGuard)
  @Get('sessions')
  async getSessions() {
    try {
      return await firstValueFrom(
        this.whatsappSenderClient
          .send({ cmd: 'whatsapp_sender_sessions' }, {})
          .pipe(catchError((error) => { throw error; })),
      );
    } catch {
      throw new ServiceUnavailableException({
        status: 'down',
        service: 'whatsapp-sender',
      });
    }
  }

  @UseGuards(JwtGuard)
  @Post('sessions')
  @HttpCode(201)
  async createSession(@Body() body: CreateSessionDto) {
    try {
      return await firstValueFrom(
        this.whatsappSenderClient
          .send({ cmd: 'whatsapp_sender_create_session' }, { sessionId: body.sessionId })
          .pipe(catchError((error) => { throw error; })),
      );
    } catch {
      throw new ServiceUnavailableException({
        status: 'down',
        service: 'whatsapp-sender',
      });
    }
  }

  @UseGuards(JwtGuard)
  @Get('sessions/:sessionId/qr')
  async getSessionQr(@Param('sessionId') sessionId: string) {
    try {
      return await firstValueFrom(
        this.whatsappSenderClient
          .send({ cmd: 'whatsapp_sender_qr' }, { sessionId })
          .pipe(catchError((error) => { throw error; })),
      );
    } catch {
      throw new ServiceUnavailableException({
        status: 'down',
        service: 'whatsapp-sender',
      });
    }
  }

  @UseGuards(JwtGuard)
  @Get('sessions/:sessionId/status')
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    try {
      return await firstValueFrom(
        this.whatsappSenderClient
          .send({ cmd: 'whatsapp_sender_session_status' }, { sessionId })
          .pipe(catchError((error) => { throw error; })),
      );
    } catch {
      throw new ServiceUnavailableException({
        status: 'down',
        service: 'whatsapp-sender',
      });
    }
  }

  @UseGuards(JwtGuard)
  @Delete('sessions/:sessionId')
  async deleteSession(@Param('sessionId') sessionId: string) {
    try {
      return await firstValueFrom(
        this.whatsappSenderClient
          .send({ cmd: 'whatsapp_sender_delete_session' }, { sessionId })
          .pipe(catchError((error) => { throw error; })),
      );
    } catch {
      throw new ServiceUnavailableException({
        status: 'down',
        service: 'whatsapp-sender',
      });
    }
  }

  @UseGuards(JwtGuard)
  @Post('sessions/:sessionId/bulk-send')
  @HttpCode(202)
  async bulkSend(
    @Param('sessionId') sessionId: string,
    @Body() body: BulkSendDto,
    @User() user: AuthUser,
  ) {
    const jobId = this.bulkSendService.createJob(sessionId, body.messages, user.id, body.templateTitle);
    return { jobId };
  }

  @UseGuards(JwtGuard)
  @Get('bulk-send/:jobId')
  async getBulkSendStatus(@Param('jobId') jobId: string) {
    const job = this.bulkSendService.getJob(jobId);
    if (!job) throw new NotFoundException(`Job ${jobId} not found`);
    return job;
  }

  @UseGuards(JwtGuard)
  @Post('sessions/:sessionId/send')
  async sendMessage(
    @Param('sessionId') sessionId: string,
    @Body() body: SendMessageDto,
  ) {
    try {
      return await firstValueFrom(
        this.whatsappSenderClient
          .send(
            { cmd: 'whatsapp_sender_send_message' },
            { sessionId, phone: body.phone, message: body.message },
          )
          .pipe(catchError((error) => { throw error; })),
      );
    } catch {
      throw new ServiceUnavailableException({
        status: 'down',
        service: 'whatsapp-sender',
      });
    }
  }
}
