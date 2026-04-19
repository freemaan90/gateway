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
    const exceptionResponse = exception.getResponse() as any;

    const message =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : exceptionResponse?.message ?? exception.message;

    this.logger.error(
      `[${status}] ${request.method} ${request.url} — ${JSON.stringify(message)}`,
    );

    // Log del Authorization header (sin exponer el token completo)
    const authHeader = request.headers['authorization'];
    if (authHeader) {
      const tokenPreview = authHeader.substring(0, 30) + '...';
      this.logger.error(`Authorization header present: ${tokenPreview}`);
    } else {
      this.logger.error(`Authorization header: MISSING`);
    }

    // Log del body si existe (útil para errores de DTO)
    if (request.body && Object.keys(request.body).length > 0) {
      this.logger.error(`Request body: ${JSON.stringify(request.body)}`);
    }

    return response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      method: request.method,
      timestamp: new Date().toISOString(),
    });
  }
}
