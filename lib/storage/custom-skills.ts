import { skillDefinitionSchema } from "@/lib/schemas/skill";
import { getDb, type StoredCustomSkill } from "./db";

export async function listCustomSkills() { return (await getDb()).getAllFromIndex("customSkills", "by-updated").then((values) => values.reverse()); }
export async function saveCustomSkill(input: unknown) {
  const parsed = skillDefinitionSchema.parse(input);
  if (parsed.course !== "custom") throw new Error("Only custom skills can be written to browser storage.");
  const db = await getDb(); const prior = await db.get("customSkills", parsed.id); const now = new Date().toISOString();
  const value: StoredCustomSkill = { ...parsed, createdAt: prior?.createdAt ?? now, updatedAt: now };
  await db.put("customSkills", value); return value;
}
export async function deleteCustomSkill(id: string) { await (await getDb()).delete("customSkills", id); }
export async function deleteAllCustomSkills() { await (await getDb()).clear("customSkills"); }

export function createExport(skills: StoredCustomSkill[]) { return { packageType: "learnworld-custom-skills", packageVersion: 1, exportedAt: new Date().toISOString(), skills }; }
export async function importCustomSkills(input: unknown) {
  const pack = input as { packageType?: unknown; packageVersion?: unknown; skills?: unknown };
  if (pack.packageType !== "learnworld-custom-skills" || pack.packageVersion !== 1 || !Array.isArray(pack.skills)) throw new Error("This is not a supported LearnWorld export.");
  const parsed = pack.skills.map((skill) => skillDefinitionSchema.parse(skill));
  if (parsed.some((skill) => skill.course !== "custom")) throw new Error("Exports may contain custom skills only.");
  const db = await getDb(); const tx = db.transaction("customSkills", "readwrite");
  for (const skill of parsed) { const prior = await tx.store.get(skill.id); const now = new Date().toISOString(); await tx.store.put({ ...skill, id: prior && JSON.stringify(prior.simulation) !== JSON.stringify(skill.simulation) ? `${skill.id}-${crypto.randomUUID().slice(0,8)}` : skill.id, createdAt: prior?.createdAt ?? now, updatedAt: now }); }
  await tx.done; return parsed.length;
}
