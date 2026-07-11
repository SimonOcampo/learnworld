import { z } from "zod";

export const skillMasterySchema = z.object({
  skillId: z.string(), score: z.number().min(0).max(100),
  completedChallengeIds: z.array(z.string()), independentCorrect: z.number().int().nonnegative(),
  hintedCorrect: z.number().int().nonnegative(), incorrect: z.number().int().nonnegative(),
  lastStudiedAt: z.string().optional(), masteredAt: z.string().optional(),
});

export const userProgressSchema = z.object({
  schemaVersion: z.literal(1), totalXp: z.number().int().nonnegative(), level: z.number().int().positive(),
  streak: z.object({ current: z.number().int().nonnegative(), longest: z.number().int().nonnegative(), lastQualifiedLocalDate: z.string().optional() }),
  skills: z.record(skillMasterySchema), achievements: z.array(z.string()), recentSkillIds: z.array(z.string()).max(20),
});

export type UserProgress = z.infer<typeof userProgressSchema>;
export type SkillMastery = z.infer<typeof skillMasterySchema>;
