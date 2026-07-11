import { describe, expect, it } from "vitest";
import { builtInSkills, findStrongBuiltInMatch, searchSkills } from "@/lib/catalog/repository";

describe("curriculum catalog",()=>{
  it("contains every requested skill exactly once",()=>{expect(builtInSkills).toHaveLength(32);expect(new Set(builtInSkills.map(skill=>skill.id)).size).toBe(32)});
  it("searches aliases and redirects exact built-in matches",()=>{expect(searchSkills("priority queue").some(skill=>skill.id==="heaps")).toBe(true);expect(findStrongBuiltInMatch("BST")?.id).toBe("binary-search-trees")});
});
