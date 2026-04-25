import { SetMetadata } from '@nestjs/common';
import type { Role } from '@matura/db';

export const ROLES_KEY = 'roles';

/**
 * Restrict a route to one or more roles. Used together with `RolesGuard`.
 *
 * Usage:
 *
 *   @Roles('OWNER')
 *   @UseGuards(RolesGuard)
 *   @Post()
 *   create() { ... }
 */
export const Roles = (...roles: Role[]): MethodDecorator & ClassDecorator =>
  SetMetadata(ROLES_KEY, roles);
