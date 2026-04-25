import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { ZodValidationPipe } from 'nestjs-zod';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');
  const config = app.get(AppConfigService);

  app.enableCors({
    origin: config.webOrigin,
    credentials: true,
  });

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );
  app.setGlobalPrefix('api');

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Matura AkademiaAS API')
    .setDescription('Internal API for the Matura AkademiaAS exam-prep app.')
    .setVersion('0.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Firebase ID token' },
      'firebase',
    )
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.port);
  logger.log(`API listening on http://localhost:${config.port}`);
  logger.log(`Swagger UI at http://localhost:${config.port}/docs`);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
