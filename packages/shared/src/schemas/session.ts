import { z } from 'zod';
import { SessionKindSchema } from '../enums.js';
import { QuestionSchema } from './question.js';

export const SessionSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  kind: SessionKindSchema,
  configJson: z.record(z.string(), z.unknown()),
  startedAt: z.coerce.date(),
  endedAt: z.coerce.date().nullable(),
});
export type Session = z.infer<typeof SessionSchema>;

export const StartPracticeSessionInputSchema = z.object({
  subjectSlug: z.string().min(1).default('matematike'),
  count: z.number().int().min(1).max(50).default(10),
  topicPath: z.string().min(1).optional(),
  difficulty: z.number().int().min(1).max(5).optional(),
});
export type StartPracticeSessionInput = z.infer<typeof StartPracticeSessionInputSchema>;

export const PracticeSessionPayloadSchema = z.object({
  session: SessionSchema,
  questions: z.array(
    QuestionSchema.omit({
      correctAnswer: true,
      explanationMd: true,
    }).extend({
      options: z.array(
        z.object({
          id: z.string().cuid(),
          questionId: z.string().cuid(),
          label: z.string(),
          order: z.number().int(),
        }),
      ),
    }),
  ),
});
export type PracticeSessionPayload = z.infer<typeof PracticeSessionPayloadSchema>;

export const SessionSummarySchema = z.object({
  sessionId: z.string().cuid(),
  total: z.number().int().min(0),
  correct: z.number().int().min(0),
  durationMs: z.number().int().min(0),
  perTopic: z.array(
    z.object({
      topicPath: z.string(),
      total: z.number().int(),
      correct: z.number().int(),
    }),
  ),
});
export type SessionSummary = z.infer<typeof SessionSummarySchema>;
