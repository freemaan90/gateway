import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    this.logger.error(
      `[${status}] ${request.method} ${request.url} — ${JSON.stringify(exceptionResponse)}`
    );

    return response.status(status).json({
      ...(
        typeof exceptionResponse === 'string'
          ? { message: exceptionResponse }
          : exceptionResponse
      ),
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }
}

