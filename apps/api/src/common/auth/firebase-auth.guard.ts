import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { FirebaseAdminService } from './firebase-admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { IS_PUBLIC_KEY } from './public.decorator';
import type { User } from '@matura/db';

declare module 'express' {
  interface Request {
    user?: User;
    firebaseUid?: string;
  }
}

const VERIFY_ID_TOKEN_TIMEOUT_MS = 8_000;

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  private readonly logger = new Logger(FirebaseAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly firebase: FirebaseAdminService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const token = extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    let decoded: Awaited<ReturnType<FirebaseAdminService['verifyIdToken']>>;
    try {
      this.logger.log('[Guard] calling verifyIdToken...');
      decoded = await Promise.race([
        this.firebase.verifyIdToken(token),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('verifyIdToken timeout')),
            VERIFY_ID_TOKEN_TIMEOUT_MS,
          ),
        ),
      ]);
      this.logger.log(`[Guard] verified: ${decoded.uid}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.debug(`Token verification failed: ${message}`);
      if (message === 'verifyIdToken timeout') {
        throw new UnauthorizedException('Token verification timed out');
      }
      throw new UnauthorizedException('Invalid or expired token');
    }

    const email = decoded.email;
    if (!email) {
      throw new UnauthorizedException('Token missing email claim');
    }

    const user = await this.prisma.user.upsert({
      where: { firebaseUid: decoded.uid },
      create: {
        firebaseUid: decoded.uid,
        email,
        name: decoded.name ?? null,
      },
      update: {
        email,
        ...(decoded.name && { name: decoded.name }),
      },
    });

    req.user = user;
    req.firebaseUid = decoded.uid;
    return true;
  }
}

function extractBearerToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header) return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token;
}
