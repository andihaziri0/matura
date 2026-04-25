/**
 * Builds the OpenAPI document by booting NestJS in-process and writing the spec to
 * ../../packages/sdk/openapi.json. The SDK build then consumes that file.
 *
 * Invoke with `pnpm --filter @matura/api openapi:generate`.
 */
import 'reflect-metadata';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

const OUT = resolve(__dirname, '../../../packages/sdk/openapi.json');

async function main(): Promise<void> {
  const app = await NestFactory.create(AppModule, { logger: false });
  app.setGlobalPrefix('api');

  const config = new DocumentBuilder()
    .setTitle('Matura AkademiaAS API')
    .setDescription('Internal API for the Matura AkademiaAS exam-prep app.')
    .setVersion('0.0.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', description: 'Firebase ID token' },
      'firebase',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(document, null, 2), 'utf-8');
  // eslint-disable-next-line no-console
  console.log(`[openapi] wrote ${OUT}`);

  await app.close();
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
