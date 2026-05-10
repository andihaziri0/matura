/**
 * Ngarko të gjitha `*.png` nga `content/matura-fotot` në R2/S3 nën
 * `questions/matura-foto/<emër-skedari>` (i njëjti format si në seed).
 *
 * Nuk kërkon AWS CLI — përdor @aws-sdk/client-s3 dhe të njëjtat env si API-ja.
 *
 *   pnpm --filter @matura/db sync:matura-fotot-r2
 *   pnpm --filter @matura/db sync:matura-fotot-r2 -- --dry-run
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { contentTypeForBuffer } from './image-content-type.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '../../../..');
const FOTO_DIR = resolve(REPO_ROOT, 'content/matura-fotot');

function loadS3(): { client: S3Client; bucket: string } {
  const endpoint = process.env.S3_ENDPOINT;
  const region = process.env.S3_REGION ?? 'auto';
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  const bucket = process.env.S3_BUCKET;
  const forcePathStyle = process.env.S3_FORCE_PATH_STYLE === 'true';

  if (!endpoint || !accessKeyId || !secretAccessKey || !bucket) {
    throw new Error(
      'Missing S3 env: need S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_BUCKET',
    );
  }

  const client = new S3Client({
    region,
    endpoint,
    forcePathStyle,
    credentials: { accessKeyId, secretAccessKey },
  });
  return { client, bucket };
}

async function main(): Promise<void> {
  const dryRun = process.argv.includes('--dry-run');

  if (!existsSync(FOTO_DIR)) {
    throw new Error(`Missing folder: ${FOTO_DIR}`);
  }

  const files = readdirSync(FOTO_DIR).filter((f) => f.toLowerCase().endsWith('.png'));
  if (files.length === 0) {
    console.warn(`[sync-matura-fotot] no .png files in ${FOTO_DIR}`);
    return;
  }

  let s3Client: S3Client | null = null;
  let bucket = '';
  if (!dryRun) {
    const s3 = loadS3();
    s3Client = s3.client;
    bucket = s3.bucket;
  }

  for (const name of files) {
    const key = `questions/matura-foto/${name}`;
    const localPath = resolve(FOTO_DIR, name);
    if (dryRun) {
      console.log(`[dry-run] ${localPath} → ${key}`);
      continue;
    }
    const body = readFileSync(localPath);
    const contentType = contentTypeForBuffer(body);
    await s3Client!.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );
    console.log(`[upload] ${key}`);
  }

  console.log(`[sync-matura-fotot] done (${files.length} files)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
