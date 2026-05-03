import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import type { CustomOrigin } from '@nestjs/common/interfaces/external/cors-options.interface';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AppConfigService } from './config/app-config.service';
import { ZodValidationPipe } from 'nestjs-zod';

/** Dev-only: browsers treat localhost vs 127.0.0.1 as different origins. */
function expandDevCorsOrigins(primary: string): string[] {
  const set = new Set<string>([primary]);
  try {
    const u = new URL(primary);
    const swap =
      u.hostname === 'localhost' ? '127.0.0.1' : u.hostname === '127.0.0.1' ? 'localhost' : null;
    if (swap) {
      const hostPort = u.port ? `${swap}:${u.port}` : swap;
      set.add(`${u.protocol}//${hostPort}`);
    }
  } catch {
    // invalid WEB_ORIGIN — keep single entry
  }
  return [...set];
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = new Logger('Bootstrap');
  const config = app.get(AppConfigService);

  const corsAllowed =
    config.isDevelopment ? expandDevCorsOrigins(config.webOrigin) : [config.webOrigin];

  const dynamicOrigin: CustomOrigin = (origin, callback) => {
    if (!origin) {
      callback(null, true);
      return;
    }
    callback(null, corsAllowed.includes(origin));
  };

  app.enableCors({
    origin: corsAllowed.length === 1 ? corsAllowed[0] : dynamicOrigin,
    credentials: true,
    allowedHeaders: ['Authorization', 'Content-Type', 'Accept'],
  });

  logger.log(`CORS allowed origin(s): ${corsAllowed.join(', ')}`);

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
