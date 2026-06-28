import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';
import { join } from 'path';
import { mkdirSync } from 'fs';
import { env } from './config/env';

async function bootstrap() {
  const uploadsDir = join(process.cwd(), 'uploads');
  mkdirSync(uploadsDir, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });
  app.use(cookieParser());
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });

  const logger = new Logger('Gateway');

  app.useLogger(logger);

  // Obtener ConfigService
  const configService = app.get(ConfigService);

  // Leer variables
  const port = configService.get<number>('PORT') ?? 3000;
  // Configurar CORS usando config
  app.enableCors({
    origin: [env.FRONTEND_URL, 'http://localhost:3000', 'http://localhost:4000'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalInterceptors(new TransformInterceptor());
  // HttpExceptionFilter va primero (más genérico), ValidationExceptionFilter va último (más específico)
  // NestJS aplica filtros de último a primero, así que ValidationExceptionFilter tiene prioridad sobre BadRequestException
  app.useGlobalFilters(
    new HttpExceptionFilter(),
    new ValidationExceptionFilter(),
  );

  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 Server running on port ${port}`);
}

bootstrap();
