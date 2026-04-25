import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type { RecordAttemptInput, AttemptResult } from '@matura/shared';

@Injectable()
export class AttemptsService {
  constructor(private readonly prisma: PrismaService) {}

  async record(userId: string, input: RecordAttemptInput): Promise<AttemptResult> {
    const question = await this.prisma.question.findUnique({
      where: { id: input.questionId },
      include: { options: true },
    });
    if (!question) throw new NotFoundException('Question not found');

    const isCorrect = this.evaluate(question, input.answer);

    const attempt = await this.prisma.attempt.create({
      data: {
        userId,
        questionId: input.questionId,
        sessionId: input.sessionId ?? null,
        answer: input.answer,
        isCorrect,
        timeMs: input.timeMs,
      },
    });

    return {
      id: attempt.id,
      isCorrect,
      correctAnswer: this.canonicalCorrectAnswer(question),
      explanationMd: question.explanationMd,
    };
  }

  private evaluate(
    question: { kind: 'MCQ' | 'SHORT' | 'LONG'; correctAnswer: string | null; options: Array<{ id: string; isCorrect: boolean; label: string }> },
    answer: string,
  ): boolean {
    if (question.kind === 'MCQ') {
      const opt = question.options.find((o) => o.id === answer);
      return Boolean(opt?.isCorrect);
    }
    if (!question.correctAnswer) return false;
    return normalize(answer) === normalize(question.correctAnswer);
  }

  private canonicalCorrectAnswer(
    q: { kind: 'MCQ' | 'SHORT' | 'LONG'; correctAnswer: string | null; options: Array<{ id: string; isCorrect: boolean; label: string }> },
  ): string | null {
    if (q.kind === 'MCQ') {
      const correct = q.options.find((o) => o.isCorrect);
      return correct?.id ?? null;
    }
    return q.correctAnswer;
  }
}

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}
