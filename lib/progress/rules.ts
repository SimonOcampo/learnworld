import type { SkillMastery, UserProgress } from "@/lib/schemas/progress";

export const emptyProgress = (): UserProgress => ({ schemaVersion: 1, totalXp: 0, level: 1, streak: { current: 0, longest: 0 }, skills: {}, achievements: [], recentSkillIds: [] });
export const levelForXp = (xp: number) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;

export function masteryScore(value: Pick<SkillMastery, "independentCorrect" | "hintedCorrect" | "incorrect">) {
  const attempts = value.independentCorrect + value.hintedCorrect + value.incorrect;
  if (!attempts) return 0;
  const correctness = (value.independentCorrect + value.hintedCorrect) / attempts;
  const independence = (value.independentCorrect + value.hintedCorrect) ? value.independentCorrect / (value.independentCorrect + value.hintedCorrect) : 0;
  const evidence = Math.min(1, attempts / 3);
  return Math.round(Math.min(100, (75 * correctness + 25 * independence) * evidence));
}

function localDate(date: Date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }

export function completeSkill(progress: UserProgress, skillId: string, date = new Date()): UserProgress {
  const previous = progress.skills[skillId] ?? { skillId, score: 0, completedChallengeIds: [], independentCorrect: 0, hintedCorrect: 0, incorrect: 0 };
  if (previous.completedChallengeIds.includes("lesson-complete")) return progress;
  const mastery: SkillMastery = { ...previous, completedChallengeIds: [...previous.completedChallengeIds, "lesson-complete"], independentCorrect: previous.independentCorrect + 1, lastStudiedAt: date.toISOString(), score: 0 };
  mastery.score = masteryScore(mastery);
  const today = localDate(date); const yesterday = new Date(date); yesterday.setDate(yesterday.getDate() - 1);
  const current = progress.streak.lastQualifiedLocalDate === today ? progress.streak.current : progress.streak.lastQualifiedLocalDate === localDate(yesterday) ? progress.streak.current + 1 : 1;
  const withXp = awardXp(progress, 20); const achievements = [...progress.achievements];
  const completedCount = Object.values(progress.skills).filter((skill) => skill.completedChallengeIds.includes("lesson-complete")).length + 1;
  if (completedCount === 1 && !achievements.includes("first-quest")) achievements.push("first-quest");
  if (completedCount >= 3 && !achievements.includes("three-world-explorer")) achievements.push("three-world-explorer");
  return { ...withXp, skills: { ...progress.skills, [skillId]: mastery }, streak: { current, longest: Math.max(progress.streak.longest, current), lastQualifiedLocalDate: today }, achievements, recentSkillIds: [skillId, ...progress.recentSkillIds.filter((id) => id !== skillId)].slice(0, 20) };
}

export function awardXp(progress: UserProgress, xp: number): UserProgress {
  const totalXp = progress.totalXp + Math.max(0, Math.round(xp));
  return { ...progress, totalXp, level: levelForXp(totalXp) };
}
