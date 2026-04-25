import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';

@ApiTags('admin')
@ApiBearerAuth('firebase')
@Controller('admin')
@Roles('OWNER')
@UseGuards(RolesGuard)
export class AdminController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('metrics')
  @ApiOkResponse({ description: 'High-level counts for the admin dashboard.' })
  async metrics(): Promise<{
    users: number;
    questions: { total: number; published: number };
    attempts: { total: number; last7d: number };
    newUsersLast7d: number;
  }> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      users,
      totalQuestions,
      publishedQuestions,
      totalAttempts,
      attempts7d,
      newUsers7d,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.question.count(),
      this.prisma.question.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.attempt.count(),
      this.prisma.attempt.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
      this.prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    ]);

    return {
      users,
      questions: { total: totalQuestions, published: publishedQuestions },
      attempts: { total: totalAttempts, last7d: attempts7d },
      newUsersLast7d: newUsers7d,
    };
  }
}
