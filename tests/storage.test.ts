import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { deleteAllCustomSkills, importCustomSkills, listCustomSkills, saveCustomSkill, createExport } from "@/lib/storage/custom-skills";

const skill = { schemaVersion:1 as const,id:"custom-demo",title:"Demo",course:"custom" as const,moduleId:"custom-workshop",description:"A custom demo lesson.",aliases:[],keywords:[],prerequisites:[],difficulty:"intro" as const,objectives:[{id:"o1",text:"Explain the demo.",tier:1}],misconceptions:[],simulation:{schemaVersion:1 as const,templateId:"guided-lesson-v1" as const,engineId:"guided" as const,config:{}},challenges:[],capability:"guided-visual" as const,contentVersion:1 };

describe("custom skill storage",()=>{
  beforeEach(async()=>{await deleteAllCustomSkills().catch(()=>undefined)});
  it("persists and lists validated custom skills",async()=>{await saveCustomSkill(skill);expect((await listCustomSkills()).map(item=>item.id)).toEqual(["custom-demo"])});
  it("round trips an export package",async()=>{const saved=await saveCustomSkill(skill);const pack=createExport([saved]);await deleteAllCustomSkills();expect(await importCustomSkills(pack)).toBe(1);expect(await listCustomSkills()).toHaveLength(1)});
});
