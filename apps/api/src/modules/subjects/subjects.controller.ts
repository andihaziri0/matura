import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Public } from '../../common/auth/public.decorator';

@ApiTags('subjects')
@ApiBearerAuth('firebase')
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get()
  @ApiOkResponse({ description: 'List all subjects in display order.' })
  async list(): Promise<Array<{ slug: string; nameSq: string; order: number }>> {
    return this.prisma.subject.findMany({ orderBy: { order: 'asc' } });
  }
}
