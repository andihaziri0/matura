import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOkResponse } from '@nestjs/swagger';
import { Public } from '../../common/auth/public.decorator';
import { PrismaService } from '../../common/prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get('live')
  @ApiOkResponse({ description: 'Liveness probe' })
  live(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Public()
  @Get('ready')
  @ApiOkResponse({ description: 'Readiness probe — verifies DB connectivity' })
  async ready(): Promise<{ status: 'ok' | 'degraded'; db: boolean }> {
    try {
      await this.prisma.$queryRawUnsafe('SELECT 1');
      return { status: 'ok', db: true };
    } catch {
      return { status: 'degraded', db: false };
    }
  }
}
