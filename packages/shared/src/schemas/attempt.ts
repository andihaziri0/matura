import { z } from 'zod';

export const AttemptSchema = z.object({
  id: z.string().cuid(),
  userId: z.string().cuid(),
  questionId: z.string().cuid(),
  sessionId: z.string().cuid().nullable(),
  answer: z.string(),
  isCorrect: z.boolean(),
  timeMs: z.number().int().min(0),
  createdAt: z.coerce.date(),
});
export type Attempt = z.infer<typeof AttemptSchema>;

export const RecordAttemptInputSchema = z.object({
  questionId: z.string().cuid(),
  sessionId: z.string().cuid().optional(),
  answer: z.string().min(1).max(8000),
  timeMs: z.number().int().min(0).max(30 * 60 * 1000),
});
export type RecordAttemptInput = z.infer<typeof RecordAttemptInputSchema>;

export const AttemptResultSchema = z.object({
  id: z.string().cuid(),
  isCorrect: z.boolean(),
  correctAnswer: z.string().nullable(),
  explanationMd: z.string(),
});
export type AttemptResult = z.infer<typeof AttemptResultSchema>;
