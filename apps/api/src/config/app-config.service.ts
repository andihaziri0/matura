import { Injectable } from '@nestjs/common';
import { loadEnv, parseWebOrigins, type Env } from './env.schema';

@Injectable()
export class AppConfigService {
  private readonly env: Env;
  private readonly _webOrigins: Array<string | RegExp>;

  constructor() {
    this.env = loadEnv();
    this._webOrigins = parseWebOrigins(this.env.WEB_ORIGIN);
  }

  get port(): number {
    return this.env.API_PORT;
  }

  /**
   * Parsed WEB_ORIGIN entries. May contain exact strings and wildcard regexes
   * (see env.schema.ts). Pass directly to Nest's `enableCors({ origin })`.
   */
  get webOrigins(): Array<string | RegExp> {
    return this._webOrigins;
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
