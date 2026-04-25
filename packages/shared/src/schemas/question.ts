import { z } from 'zod';
import {
  ImageRoleSchema,
  QuestionKindSchema,
  QuestionStatusSchema,
  TrackSlugSchema,
} from '../enums.js';

export const QuestionOptionSchema = z.object({
  id: z.string().cuid(),
  questionId: z.string().cuid(),
  label: z.string().min(1),
  isCorrect: z.boolean(),
  order: z.number().int().min(0),
});
export type QuestionOption = z.infer<typeof QuestionOptionSchema>;

export const QuestionImageSchema = z.object({
  id: z.string().cuid(),
  questionId: z.string().cuid(),
  r2Key: z.string().min(1),
  alt: z.string().min(1),
  order: z.number().int().min(0),
  role: ImageRoleSchema,
});
export type QuestionImage = z.infer<typeof QuestionImageSchema>;

export const QuestionSchema = z.object({
  id: z.string().cuid(),
  externalId: z.string().nullable(),
  subjectSlug: z.string().min(1),
  topicPath: z.string().min(1),
  kind: QuestionKindSchema,
  difficulty: z.number().int().min(1).max(5),
  year: z.number().int().min(1990).max(2100).nullable(),
  source: z.string().nullable(),
  tracks: z.array(TrackSlugSchema).min(1),
  promptMd: z.string().min(1),
  correctAnswer: z.string().nullable(),
  explanationMd: z.string().min(1),
  hints: z.array(z.string()),
  tags: z.array(z.string()),
  estimatedSec: z.number().int().min(1),
  status: QuestionStatusSchema,
  createdById: z.string().cuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  options: z.array(QuestionOptionSchema).default([]),
  images: z.array(QuestionImageSchema).default([]),
});
export type Question = z.infer<typeof QuestionSchema>;

// ----------------------------------------------------------------------
// Inputs
// ----------------------------------------------------------------------

export const CreateQuestionOptionInputSchema = z.object({
  label: z.string().min(1),
  isCorrect: z.boolean(),
  order: z.number().int().min(0),
});

export const CreateQuestionImageInputSchema = z.object({
  r2Key: z.string().min(1),
  alt: z.string().min(1),
  order: z.number().int().min(0),
  role: ImageRoleSchema,
});

export const CreateQuestionInputSchema = z
  .object({
    externalId: z.string().min(1).optional(),
    subjectSlug: z.string().min(1),
    topicPath: z.string().min(1),
    kind: QuestionKindSchema,
    difficulty: z.number().int().min(1).max(5),
    year: z.number().int().min(1990).max(2100).optional(),
    source: z.string().min(1).optional(),
    tracks: z.array(TrackSlugSchema).min(1),
    promptMd: z.string().min(1),
    correctAnswer: z.string().min(1).optional(),
    explanationMd: z.string().min(1),
    hints: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    estimatedSec: z.number().int().min(1).default(60),
    status: QuestionStatusSchema.default('DRAFT'),
    options: z.array(CreateQuestionOptionInputSchema).default([]),
    images: z.array(CreateQuestionImageInputSchema).default([]),
  })
  .superRefine((q, ctx) => {
    if (q.kind === 'MCQ') {
      if (q.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'Pyetjet me opsione duhet të kenë së paku 2 opsione.',
        });
      }
      if (!q.options.some((o) => o.isCorrect)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['options'],
          message: 'Të paktën një opsion duhet të jetë i saktë.',
        });
      }
    }
    if ((q.kind === 'SHORT' || q.kind === 'LONG') && !q.correctAnswer) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['correctAnswer'],
        message: 'Përgjigja e saktë është e detyrueshme për këtë lloj pyetjeje.',
      });
    }
  });
export type CreateQuestionInput = z.infer<typeof CreateQuestionInputSchema>;

export const UpdateQuestionInputSchema = CreateQuestionInputSchema.innerType().partial();
export type UpdateQuestionInput = z.infer<typeof UpdateQuestionInputSchema>;

// ----------------------------------------------------------------------
// Listing
// ----------------------------------------------------------------------

export const ListQuestionsQuerySchema = z.object({
  subjectSlug: z.string().min(1).optional(),
  topicPath: z.string().min(1).optional(),
  status: QuestionStatusSchema.optional(),
  difficulty: z.coerce.number().int().min(1).max(5).optional(),
  search: z.string().min(1).optional(),
  cursor: z.string().cuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export type ListQuestionsQuery = z.infer<typeof ListQuestionsQuerySchema>;

export const QuestionListItemSchema = QuestionSchema.pick({
  id: true,
  subjectSlug: true,
  topicPath: true,
  kind: true,
  difficulty: true,
  status: true,
  promptMd: true,
  updatedAt: true,
});
export type QuestionListItem = z.infer<typeof QuestionListItemSchema>;

// ----------------------------------------------------------------------
// Image upload presign
// ----------------------------------------------------------------------

export const PresignImageUploadInputSchema = z.object({
  filename: z.string().min(1),
  contentType: z
    .string()
    .regex(/^image\/(png|jpeg|jpg|webp|gif)$/, 'Pranohen vetëm imazhe.'),
  sizeBytes: z.number().int().min(1).max(8 * 1024 * 1024),
});
export type PresignImageUploadInput = z.infer<typeof PresignImageUploadInputSchema>;

export const PresignImageUploadResponseSchema = z.object({
  uploadUrl: z.string().url(),
  r2Key: z.string().min(1),
  publicUrl: z.string().url(),
  expiresInSeconds: z.number().int().positive(),
});
export type PresignImageUploadResponse = z.infer<typeof PresignImageUploadResponseSchema>;
