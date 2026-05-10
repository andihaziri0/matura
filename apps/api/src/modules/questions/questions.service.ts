import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import type {
  CreateQuestionInput,
  ListQuestionsQuery,
  UpdateQuestionInput,
} from '@matura/shared';
import type { Prisma, Question } from '@matura/db';

@Injectable()
export class QuestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(query: ListQuestionsQuery) {
    const where: Prisma.QuestionWhereInput = {
      ...(query.subjectSlug && { subjectSlug: query.subjectSlug }),
      ...(query.topicPath && { topicPath: { startsWith: query.topicPath } }),
      ...(query.status && { status: query.status }),
      ...(query.difficulty && { difficulty: query.difficulty }),
      ...(query.search && {
        OR: [
          { promptMd: { contains: query.search, mode: 'insensitive' } },
          { tags: { has: query.search } },
        ],
      }),
    };

    const items = await this.prisma.question.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take: query.limit,
      ...(query.cursor && { cursor: { id: query.cursor }, skip: 1 }),
      include: {
        options: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
      },
    });

    const nextCursor = items.length === query.limit ? items[items.length - 1]?.id ?? null : null;
    return { items, nextCursor };
  }

  async getById(id: string) {
    const q = await this.prisma.question.findUnique({
      where: { id },
      include: {
        options: { orderBy: { order: 'asc' } },
        images: { orderBy: { order: 'asc' } },
      },
    });
    if (!q) throw new NotFoundException(`Question ${id} not found`);
    return q;
  }

  async create(authorId: string, input: CreateQuestionInput) {
    return this.prisma.question.create({
      data: {
        externalId: input.externalId ?? null,
        subjectSlug: input.subjectSlug,
        topicPath: input.topicPath,
        kind: input.kind,
        difficulty: input.difficulty,
        year: input.year ?? null,
        source: input.source ?? null,
        tracks: input.tracks,
        promptMd: input.promptMd,
        correctAnswer: input.correctAnswer ?? null,
        explanationMd: input.explanationMd,
        hints: input.hints,
        tags: input.tags,
        estimatedSec: input.estimatedSec,
        status: input.status,
        createdById: authorId,
        options: { create: input.options },
        images: { create: input.images },
      },
      include: { options: true, images: true },
    });
  }

  async update(id: string, input: UpdateQuestionInput) {
    await this.getById(id);
    const { options, images, ...rest } = input;
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.question.update({
        where: { id },
        data: {
          ...(rest.subjectSlug !== undefined && { subjectSlug: rest.subjectSlug }),
          ...(rest.topicPath !== undefined && { topicPath: rest.topicPath }),
          ...(rest.kind !== undefined && { kind: rest.kind }),
          ...(rest.difficulty !== undefined && { difficulty: rest.difficulty }),
          ...(rest.year !== undefined && { year: rest.year ?? null }),
          ...(rest.source !== undefined && { source: rest.source ?? null }),
          ...(rest.tracks !== undefined && { tracks: rest.tracks }),
          ...(rest.promptMd !== undefined && { promptMd: rest.promptMd }),
          ...(rest.correctAnswer !== undefined && { correctAnswer: rest.correctAnswer ?? null }),
          ...(rest.explanationMd !== undefined && { explanationMd: rest.explanationMd }),
          ...(rest.hints !== undefined && { hints: rest.hints }),
          ...(rest.tags !== undefined && { tags: rest.tags }),
          ...(rest.estimatedSec !== undefined && { estimatedSec: rest.estimatedSec }),
          ...(rest.status !== undefined && { status: rest.status }),
        },
      });

      if (options !== undefined) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
        if (options.length > 0) {
          await tx.questionOption.createMany({
            data: options.map((o) => ({ ...o, questionId: id })),
          });
        }
      }

      if (images !== undefined) {
        await tx.questionImage.deleteMany({ where: { questionId: id } });
        if (images.length > 0) {
          await tx.questionImage.createMany({
            data: images.map((i) => ({ ...i, questionId: id })),
          });
        }
      }

      return tx.question.findUniqueOrThrow({
        where: { id: updated.id },
        include: { options: { orderBy: { order: 'asc' } }, images: { orderBy: { order: 'asc' } } },
      });
    });
  }

  async setStatus(id: string, status: 'DRAFT' | 'REVIEW' | 'PUBLISHED'): Promise<Question> {
    await this.getById(id);
    return this.prisma.question.update({ where: { id }, data: { status } });
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.prisma.question.delete({ where: { id } });
  }
}
