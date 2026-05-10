import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import type { Prisma, User } from '@matura/db';
import { PrismaService } from '../../common/prisma/prisma.service';
import { practiceChapterTopicWhere } from '../../common/prisma/practice-topic-where';
import type { StartPracticeSessionInput } from '@matura/shared';

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j]!, arr[i]!];
  }
  return arr;
}

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Start a practice session and return a *sanitised* set of questions.
   * Sensitive fields (`correctAnswer`, `explanationMd`, `option.isCorrect`)
   * are stripped — the client only sees them after recording an attempt.
   */
  async startPractice(user: User, input: StartPracticeSessionInput) {
    const userId = user.id;
    const statusFilter: Pick<Prisma.QuestionWhereInput, 'status'> =
      input.includeReview === true
        ? { status: { in: ['PUBLISHED', 'REVIEW'] } }
        : { status: 'PUBLISHED' };

    const where: Prisma.QuestionWhereInput = {
      subjectSlug: input.subjectSlug,
      ...statusFilter,
      ...(input.topicPath && practiceChapterTopicWhere(input.topicPath)),
      ...(input.difficulty != null && { difficulty: input.difficulty }),
      ...(input.hasImages === true && { images: { some: { role: 'FULL_QUESTION' } } }),
      ...(input.tag && { tags: { has: input.tag } }),
    };

    const total = await this.prisma.question.count({ where });
    if (total === 0) {
      const session = await this.prisma.session.create({
        data: { userId, kind: 'PRACTICE', configJson: { ...input } },
      });
      return { session, questions: [] };
    }

    const candidates = await this.prisma.question.findMany({
      where,
      select: { id: true },
    });
    const ids = shuffleInPlace(candidates.map((c) => c.id)).slice(0, input.count);

    const idOrder = new Map(ids.map((id, i) => [id, i]));
    const rows = await this.prisma.question.findMany({
      where: { id: { in: ids } },
      include: {
        options: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
      },
    });
    rows.sort((a, b) => (idOrder.get(a.id) ?? 0) - (idOrder.get(b.id) ?? 0));

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

  async end(user: User, sessionId: string) {
    const userId = user.id;
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
