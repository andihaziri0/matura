import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { readFile } from 'node:fs/promises';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class S3Service implements OnModuleInit {
  private readonly logger = new Logger(S3Service.name);
  private client!: S3Client;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    const s3 = this.config.s3;
    this.client = new S3Client({
      region: s3.region,
      endpoint: s3.endpoint,
      forcePathStyle: s3.forcePathStyle,
      credentials: {
        accessKeyId: s3.accessKeyId,
        secretAccessKey: s3.secretAccessKey,
      },
    });
    this.logger.log(`S3 client ready (endpoint=${s3.endpoint}, bucket=${s3.bucket})`);
  }

  async presignPut(args: {
    key: string;
    contentType: string;
    expiresInSeconds?: number;
  }): Promise<{ uploadUrl: string; publicUrl: string; expiresInSeconds: number }> {
    const { bucket, publicBaseUrl } = this.config.s3;
    const expires = args.expiresInSeconds ?? 600;

    const cmd = new PutObjectCommand({
      Bucket: bucket,
      Key: args.key,
      ContentType: args.contentType,
    });
    const uploadUrl = await getSignedUrl(this.client, cmd, { expiresIn: expires });

    return {
      uploadUrl,
      publicUrl: `${publicBaseUrl.replace(/\/$/, '')}/${args.key}`,
      expiresInSeconds: expires,
    };
  }

  /** Upload a local file directly to the bucket. Used by the content importer. */
  async putObjectFromFile(args: {
    key: string;
    localPath: string;
    contentType: string;
  }): Promise<{ key: string; publicUrl: string }> {
    const { bucket, publicBaseUrl } = this.config.s3;
    const body = await readFile(args.localPath);
    await this.client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: args.key,
        Body: body,
        ContentType: args.contentType,
      }),
    );
    return {
      key: args.key,
      publicUrl: `${publicBaseUrl.replace(/\/$/, '')}/${args.key}`,
    };
  }
}
