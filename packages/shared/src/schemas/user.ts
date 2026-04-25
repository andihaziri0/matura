import { z } from 'zod';
import { RoleSchema, TrackSchema } from '../enums.js';

export const UserSchema = z.object({
  id: z.string().cuid(),
  firebaseUid: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1).nullable(),
  role: RoleSchema,
  track: TrackSchema.nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type User = z.infer<typeof UserSchema>;

export const UpdateProfileInputSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  track: TrackSchema.nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;

export const PublicUserSchema = UserSchema.pick({
  id: true,
  email: true,
  name: true,
  role: true,
  track: true,
});
export type PublicUser = z.infer<typeof PublicUserSchema>;
