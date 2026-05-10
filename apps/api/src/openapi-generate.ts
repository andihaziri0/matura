/**
 * Builds the OpenAPI document by booting NestJS in-process and writing the spec to
 * ../../packages/sdk/openapi.json. The SDK build then consumes that file.
 *
 * Invoke with `pnpm --filter @matura/api openapi:generate`.
 */
import 'reflect-metadata';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

/** One line from repo-root `.env` → key/value (no shell `source` needed). */
function parseEnvLine(line: string): { key: string; val: string } | null {
  let t = line.trim();
  if (!t || t.startsWith('#')) return null;
  if (t.startsWith('export ')) t = t.slice('export '.length).trim();
  const eq = t.indexOf('=');
  if (eq < 1) return null;
  const key = t.slice(0, eq).trim();
  let rest = t.slice(eq + 1).trim();
  if (!key) return null;

  if (rest.startsWith('"')) {
    const end = rest.indexOf('"', 1);
    rest = end === -1 ? rest.slice(1) : rest.slice(1, end);
  } else if (rest.startsWith("'")) {
    const end = rest.indexOf("'", 1);
    rest = end === -1 ? rest.slice(1) : rest.slice(1, end);
  } else {
    const cut = rest.search(/\s+#/);
    if (cut !== -1) rest = rest.slice(0, cut).trim();
  }
  return { key, val: rest };
}

/** Load repo-root `.env` so `tsx src/openapi-generate.ts` works in fresh shells / CI. */
function loadRootEnv(): void {
  const envPath = resolve(__dirname, '../../../.env');
  if (!existsSync(envPath)) return;
  let text = readFileSync(envPath, 'utf-8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  for (const line of text.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (process.env[parsed.key] === undefined) process.env[parsed.key] = parsed.val;
  }
}

/**
 * This task never connects to Postgres/Redis/S3; Nest still validates env at boot.
 * Always set concrete dummy URLs for connection-related keys so a malformed local
 * `.env` (or `prisma+postgres://`, etc.) cannot break `pnpm openapi:generate`.
 * Other keys are left as loaded from the environment / repo-root `.env`.
 */
function applyOpenapiCodegenEnv(): void {
  process.env.DATABASE_URL = 'postgresql://127.0.0.1:5432/openapi_codegen';
  process.env.REDIS_URL = 'redis://127.0.0.1:6379';
  process.env.S3_ENDPOINT = 'http://127.0.0.1:9000';
  process.env.S3_ACCESS_KEY_ID = 'openapi_codegen';
  process.env.S3_SECRET_ACCESS_KEY = 'openapi_codegen';
  process.env.S3_BUCKET = 'matura-content';
  process.env.S3_PUBLIC_BASE_URL = 'http://127.0.0.1:9000/matura-content';
}

const OUT = resolve(__dirname, '../../../packages/sdk/openapi.json');

async function main(): Promise<void> {
  loadRootEnv();
  applyOpenapiCodegenEnv();
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

  console.log(`[openapi] wrote ${OUT}`);

  await app.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
