import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Inject,
  Logger,
  Param,
  Post,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { catchError, firstValueFrom, retry } from 'rxjs';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { WHATSAPP_SENDER } from 'src/service';
import { CreateSessionDto } from './dtos/create-session.dto';
import { SendMessageDto } from './dtos/send-message.dto';

@Controller('whatsapp-sender')
export class WhatsappSenderController {
  private readonly logger = new Logger(WhatsappSenderController.name);

  constructor(
    @Inject(WHATSAPP_SENDER)
    private readonly whatsappSenderClient: ClientProxy,
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
