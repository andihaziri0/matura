import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import type { User } from '@matura/db';

/**
 * Resolves the authenticated user (Postgres `User` row) attached by `FirebaseAuthGuard`.
 *
 * Usage:
 *
 *   @Get('me')
 *   me(@CurrentUser() user: User) { ... }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.user) {
      throw new UnauthorizedException('No authenticated user attached to request');
    }
    return req.user;
  },
);
