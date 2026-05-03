import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import * as admin from 'firebase-admin';
import { AppConfigService } from '../../config/app-config.service';

@Injectable()
export class FirebaseAdminService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAdminService.name);
  private app: admin.app.App | null = null;

  constructor(private readonly config: AppConfigService) {}

  onModuleInit(): void {
    if (admin.apps.length > 0) {
      this.app = admin.app();
      return;
    }

    const credential = this.resolveCredential();
    if (!credential) {
      this.logger.warn(
        'Firebase service account not configured — auth verification will reject all tokens. ' +
          'Set FIREBASE_SERVICE_ACCOUNT_BASE64 or FIREBASE_SERVICE_ACCOUNT_PATH to enable.',
      );
      return;
    }

    this.app = admin.initializeApp({ credential });
    this.logger.log('Firebase Admin initialized');
  }

  get auth(): admin.auth.Auth | null {
    return this.app?.auth() ?? null;
  }

  /**
   * Verifies the Firebase ID token. The Admin SDK may perform outbound HTTPS calls
   * to Google (e.g. certificate / JWKS fetch); network or firewall issues can stall
   * without throwing — callers should enforce a timeout (see FirebaseAuthGuard).
   */
  async verifyIdToken(token: string): Promise<admin.auth.DecodedIdToken> {
    if (!this.auth) {
      throw new Error('Firebase Admin not initialized');
    }
    return this.auth.verifyIdToken(token);
  }

  async setCustomClaims(uid: string, claims: Record<string, unknown>): Promise<void> {
    if (!this.auth) {
      throw new Error('Firebase Admin not initialized');
    }
    await this.auth.setCustomUserClaims(uid, claims);
  }

  private resolveCredential(): admin.credential.Credential | null {
    const { serviceAccountBase64, serviceAccountPath } = this.config.firebase;

    if (serviceAccountBase64 && serviceAccountBase64.length > 0) {
      const json = Buffer.from(serviceAccountBase64, 'base64').toString('utf-8');
      const parsed = JSON.parse(json) as admin.ServiceAccount;
      return admin.credential.cert(parsed);
    }

    if (serviceAccountPath && serviceAccountPath.length > 0) {
      const json = readFileSync(serviceAccountPath, 'utf-8');
      const parsed = JSON.parse(json) as admin.ServiceAccount;
      return admin.credential.cert(parsed);
    }

    return null;
  }
}
