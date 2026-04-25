import { Injectable } from '@nestjs/common';
import { loadEnv, type Env } from './env.schema';

@Injectable()
export class AppConfigService {
  private readonly env: Env;

  constructor() {
    this.env = loadEnv();
  }

  get port(): number {
    return this.env.API_PORT;
  }

  get webOrigin(): string {
    return this.env.WEB_ORIGIN;
  }

  get isProduction(): boolean {
    return this.env.NODE_ENV === 'production';
  }

  get isDevelopment(): boolean {
    return this.env.NODE_ENV === 'development';
  }

  get redisUrl(): string {
    return this.env.REDIS_URL;
  }

  get s3(): {
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucket: string;
    forcePathStyle: boolean;
    publicBaseUrl: string;
  } {
    return {
      endpoint: this.env.S3_ENDPOINT,
      region: this.env.S3_REGION,
      accessKeyId: this.env.S3_ACCESS_KEY_ID,
      secretAccessKey: this.env.S3_SECRET_ACCESS_KEY,
      bucket: this.env.S3_BUCKET,
      forcePathStyle: this.env.S3_FORCE_PATH_STYLE,
      publicBaseUrl: this.env.S3_PUBLIC_BASE_URL,
    };
  }

  get firebase(): { serviceAccountBase64?: string; serviceAccountPath?: string } {
    return {
      serviceAccountBase64: this.env.FIREBASE_SERVICE_ACCOUNT_BASE64,
      serviceAccountPath: this.env.FIREBASE_SERVICE_ACCOUNT_PATH,
    };
  }
}
