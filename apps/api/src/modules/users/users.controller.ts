import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from 'nestjs-zod';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { User } from '@matura/db';
import { UpdateProfileInputSchema, type UpdateProfileInput } from '@matura/shared';

@ApiTags('users')
@ApiBearerAuth('firebase')
@Controller('users')
export class UsersController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('me')
  @ApiOkResponse({ description: 'Returns the authenticated user profile.' })
  me(@CurrentUser() user: User): User {
    return user;
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: User,
    @Body(new ZodValidationPipe(UpdateProfileInputSchema)) input: UpdateProfileInput,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: user.id },
      data: {
        ...(input.name !== undefined && { name: input.name }),
        ...(input.track !== undefined && { track: input.track }),
      },
    });
  }
}
