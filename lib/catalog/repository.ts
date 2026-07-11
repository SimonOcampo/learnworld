import rawCatalog from "@/content/curriculum/catalog.json";
import { catalogSchema, type SkillDefinition } from "@/lib/schemas/skill";

const catalog = catalogSchema.parse(rawCatalog);
export const builtInSkills = catalog.skills;
export const builtInSkillById = new Map(builtInSkills.map((skill) => [skill.id, skill]));

export function searchSkills(query: string, course?: "cs1" | "cs2") {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return builtInSkills.filter((skill) => {
    if (course && skill.course !== course) return false;
    const haystack = [skill.title, skill.description, ...skill.aliases, ...skill.keywords].join(" ").toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

export function findStrongBuiltInMatch(title: string): SkillDefinition | undefined {
  const normalized = title.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  return builtInSkills.find((skill) => [skill.title, ...skill.aliases].some((name) => name.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim() === normalized));
}
