import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { ValidationExceptionFilter } from './common/filters/validation-exception.filter';
import cookieParser from 'cookie-parser';


async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true, // opcional pero recomendado
  });

  const logger = new Logger('Gateway');

  app.useLogger(logger);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  // 👇 interceptor global
  app.useGlobalInterceptors(new TransformInterceptor());
  // 👇 Activar el filtro global
  app.useGlobalFilters(new ValidationExceptionFilter());

  const port = process.env.PORT ?? 3000;
  app.use(cookieParser());
  await app.listen(port);

  logger.log(`🚀 Server running on port ${port}`);
}

bootstrap();
