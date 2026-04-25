import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { StartPracticeSessionInput } from '@matura/shared';

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a practice session and return a *sanitised* set of questions.
   * Sensitive fields (`correctAnswer`, `explanationMd`, `option.isCorrect`)
   * are stripped — the client only sees them after recording an attempt.
   */
  async startPractice(userId: string, input: StartPracticeSessionInput) {
    const where = {
      subjectSlug: input.subjectSlug,
      status: 'PUBLISHED' as const,
      ...(input.topicPath && { topicPath: { startsWith: input.topicPath } }),
      ...(input.difficulty && { difficulty: input.difficulty }),
    };

    const total = await this.prisma.question.count({ where });
    if (total === 0) {
      const session = await this.prisma.session.create({
        data: { userId, kind: 'PRACTICE', configJson: { ...input } },
      });
      return { session, questions: [] };
    }

    const ids = await this.prisma.$queryRawUnsafe<Array<{ id: string }>>(
      `SELECT id FROM "Question" WHERE "subjectSlug" = $1 AND "status" = 'PUBLISHED'
        ${input.topicPath ? `AND "topicPath" LIKE $2 || '%'` : ''}
        ${input.difficulty ? (input.topicPath ? `AND "difficulty" = $3` : `AND "difficulty" = $2`) : ''}
       ORDER BY random() LIMIT ${input.count}`,
      ...([input.subjectSlug, input.topicPath, input.difficulty].filter(
        (v) => v !== undefined,
      ) as unknown[]),
    );

    const rows = await this.prisma.question.findMany({
      where: { id: { in: ids.map((r) => r.id) } },
      include: {
        options: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
      },
    });

    const session = await this.prisma.session.create({
      data: {
        userId,
        kind: 'PRACTICE',
        configJson: { ...input, questionIds: rows.map((q) => q.id) },
      },
    });

    const questions = rows.map((q) => ({
      id: q.id,
      externalId: q.externalId,
      subjectSlug: q.subjectSlug,
      topicPath: q.topicPath,
      kind: q.kind,
      difficulty: q.difficulty,
      year: q.year,
      source: q.source,
      tracks: q.tracks,
      promptMd: q.promptMd,
      hints: q.hints,
      tags: q.tags,
      estimatedSec: q.estimatedSec,
      status: q.status,
      createdById: q.createdById,
      createdAt: q.createdAt,
      updatedAt: q.updatedAt,
      options: q.options.map((o) => ({
        id: o.id,
        questionId: o.questionId,
        label: o.label,
        order: o.order,
      })),
      images: q.images,
    }));

    return { session, questions };
  }

  async end(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: { attempts: { include: { question: true } } },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.session.update({
      where: { id: sessionId },
      data: { endedAt: new Date() },
    });

    const total = session.attempts.length;
    const correct = session.attempts.filter((a) => a.isCorrect).length;
    const durationMs = updated.endedAt
      ? updated.endedAt.getTime() - updated.startedAt.getTime()
      : 0;

    const byTopic = new Map<string, { total: number; correct: number }>();
    for (const a of session.attempts) {
      const t = a.question.topicPath;
      const cur = byTopic.get(t) ?? { total: 0, correct: 0 };
      cur.total += 1;
      if (a.isCorrect) cur.correct += 1;
      byTopic.set(t, cur);
    }

    return {
      sessionId,
      total,
      correct,
      durationMs,
      perTopic: Array.from(byTopic.entries()).map(([topicPath, v]) => ({
        topicPath,
        ...v,
      })),
    };
  }
}
