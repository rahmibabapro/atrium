import { z } from "zod";

export const warnSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string().optional(),
  reason: z.string().min(1).max(500),
  by: z.string(),
  byLabel: z.string(),
  at: z.string(),
});

export const noteSchema = z.object({
  id: z.string(),
  userId: z.string(),
  body: z.string().min(1).max(2000),
  by: z.string(),
  byLabel: z.string(),
  at: z.string(),
});

export const purgeSchema = z.object({
  id: z.string(),
  userId: z.string(),
  username: z.string().optional(),
  scope: z.enum(["messages", "threads", "all"]),
  status: z.enum(["queued", "done", "failed"]),
  by: z.string(),
  byLabel: z.string(),
  at: z.string(),
  note: z.string().optional(),
});

export const moderationStoreSchema = z.object({
  warnings: z.array(warnSchema).default([]),
  notes: z.array(noteSchema).default([]),
  purges: z.array(purgeSchema).default([]),
});

export type ModerationStore = z.infer<typeof moderationStoreSchema>;
export type ModerationWarning = z.infer<typeof warnSchema>;
export type ModerationPurge = z.infer<typeof purgeSchema>;
