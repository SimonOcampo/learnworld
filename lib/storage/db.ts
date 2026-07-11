import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { SkillDefinition } from "@/lib/schemas/skill";
import type { UserProgress } from "@/lib/schemas/progress";
import { emptyProgress } from "@/lib/progress/rules";

export type StoredCustomSkill = SkillDefinition & { createdAt: string; updatedAt: string; variantOf?: string };
export type StoredSession = { id: string; title: string; skillIds: string[]; status: "draft" | "active" | "completed"; updatedAt: string };

interface LearnWorldDB extends DBSchema {
  customSkills: { key: string; value: StoredCustomSkill; indexes: { "by-updated": string } };
  progress: { key: string; value: UserProgress };
  sessions: { key: string; value: StoredSession; indexes: { "by-updated": string } };
  meta: { key: string; value: unknown };
}

let database: Promise<IDBPDatabase<LearnWorldDB>> | undefined;
export function getDb() {
  if (typeof indexedDB === "undefined") throw new Error("Browser storage is unavailable.");
  database ??= openDB<LearnWorldDB>("learnworld", 1, { upgrade(db) {
    const skills = db.createObjectStore("customSkills", { keyPath: "id" }); skills.createIndex("by-updated", "updatedAt");
    const sessions = db.createObjectStore("sessions", { keyPath: "id" }); sessions.createIndex("by-updated", "updatedAt");
    db.createObjectStore("progress"); db.createObjectStore("meta");
  } });
  return database;
}

export async function getProgress() { return (await getDb()).get("progress", "current").then((value) => value ?? emptyProgress()); }
export async function saveProgress(value: UserProgress) { await (await getDb()).put("progress", value, "current"); }
