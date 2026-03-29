import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('Validation');

  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    // Log detallado
    this.logger.error(
      `Validation failed: ${JSON.stringify(exceptionResponse.message)}`,
    );

    const request = ctx.getRequest<Request>();
    this.logger.error(`Body received: ${JSON.stringify(request.body)}`);

    // Respuesta al cliente
    return response.status(status).json({
      statusCode: status,
      error: 'Bad Request',
      message: exceptionResponse.message,
    });
  }
}
