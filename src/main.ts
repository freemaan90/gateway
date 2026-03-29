import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import { ConfigService } from '@nestjs/config';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.use(cookieParser());

  const logger = new Logger('Gateway');

  app.useLogger(logger);

  // Obtener ConfigService
  const configService = app.get(ConfigService);

  // Leer variables
  const port = configService.get<number>('PORT') ?? 3000;
  // Configurar CORS usando config
app.enableCors({
  origin: 'http://localhost:3000',
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
  app.useGlobalFilters(new ValidationExceptionFilter());

  await app.listen(port);

  logger.log(`🚀 Server running on port ${port}`);
}

bootstrap();
