import { z } from 'zod';

export const ROLES = ['OWNER', 'STUDENT', 'TEACHER'] as const;
export const TRACKS = ['PERGJITHSHEM', 'NATYROR', 'SHOQEROR', 'GJUHESOR'] as const;
export const QUESTION_KINDS = ['MCQ', 'SHORT', 'LONG'] as const;
export const QUESTION_STATUSES = ['DRAFT', 'REVIEW', 'PUBLISHED'] as const;
export const IMAGE_ROLES = ['INLINE', 'FIGURE', 'FULL_QUESTION'] as const;
export const SESSION_KINDS = ['PRACTICE', 'MOCK', 'PLAN'] as const;
export const AI_CONTEXTS = ['QUESTION', 'TOPIC', 'SESSION', 'FREE'] as const;

export const TRACK_LOWERCASE = [
  'pergjithshem',
  'natyror',
  'shoqeror',
  'gjuhesor',
] as const;

export type Role = (typeof ROLES)[number];
export type Track = (typeof TRACKS)[number];
export type QuestionKind = (typeof QUESTION_KINDS)[number];
export type QuestionStatus = (typeof QUESTION_STATUSES)[number];
export type ImageRole = (typeof IMAGE_ROLES)[number];
export type SessionKind = (typeof SESSION_KINDS)[number];
export type AiContext = (typeof AI_CONTEXTS)[number];
export type TrackSlug = (typeof TRACK_LOWERCASE)[number];

export const RoleSchema = z.enum(ROLES);
export const TrackSchema = z.enum(TRACKS);
export const TrackSlugSchema = z.enum(TRACK_LOWERCASE);
export const QuestionKindSchema = z.enum(QUESTION_KINDS);
export const QuestionStatusSchema = z.enum(QUESTION_STATUSES);
export const ImageRoleSchema = z.enum(IMAGE_ROLES);
export const SessionKindSchema = z.enum(SESSION_KINDS);
export const AiContextSchema = z.enum(AI_CONTEXTS);
