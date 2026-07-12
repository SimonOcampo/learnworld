import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteAllCustomSkills, importCustomSkills, listCustomSkills, saveCustomSkill, createExport } from "@/lib/storage/custom-skills";
import { completeStoredSkill, getDb, getProgress } from "@/lib/storage/db";

const skill = { schemaVersion:1 as const,id:"custom-demo",title:"Demo",course:"custom" as const,moduleId:"custom-workshop",description:"A custom demo lesson.",aliases:[],keywords:[],prerequisites:[],difficulty:"intro" as const,objectives:[{id:"o1",text:"Explain the demo.",tier:1}],misconceptions:[],simulation:{schemaVersion:1 as const,templateId:"guided-lesson-v1" as const,engineId:"guided" as const,config:{}},challenges:[],capability:"guided-visual" as const,contentVersion:1 };

describe("browser storage",()=>{
  beforeEach(async()=>{
    await deleteAllCustomSkills().catch(()=>undefined);
    await (await getDb()).delete("progress", "current");
  });
  it("persists and lists validated custom skills",async()=>{await saveCustomSkill(skill);expect((await listCustomSkills()).map(item=>item.id)).toEqual(["custom-demo"])});
  it("round trips an export package",async()=>{const saved=await saveCustomSkill(skill);const pack=createExport([saved]);await deleteAllCustomSkills();expect(await importCustomSkills(pack)).toBe(1);expect(await listCustomSkills()).toHaveLength(1)});
  it("persists lesson completion and prevents duplicate XP",async()=>{
    await completeStoredSkill("custom-demo", new Date("2026-07-11T12:00:00Z"));
    expect(await getProgress()).toMatchObject({ totalXp: 20, skills: { "custom-demo": { completedChallengeIds: ["lesson-complete"] } } });
    const replay = await completeStoredSkill("custom-demo", new Date("2026-07-12T12:00:00Z"));
    expect(replay.totalXp).toBe(20);
  });
});
