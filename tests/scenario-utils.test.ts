import { describe, expect, it } from "vitest";
import { conceptIds } from "@/lib/types";
import { cloneInputs, randomControls, randomInputs, validateInputs } from "@/lib/simulations/scenario-utils";
import { defaultInputs } from "@/lib/simulations/registry";
import { dpEngine, backtrackingEngine, greedyEngine, treapsEngine, triesEngine } from "@/lib/engines";

describe("custom scenario support", () => {
  it("generates a valid fresh draft for every registered concept", () => {
    for (const concept of conceptIds) {
      const generated = randomInputs(concept, defaultInputs(concept), { size: 5, min: 1, max: 30 }, () => 0.37);
      expect(validateInputs(concept, generated)).toEqual({});
    }
  });

  it("clones drafts without sharing nested arrays", () => {
    const original = randomInputs("dijkstra", defaultInputs("dijkstra"), {}, () => 0.2);
    const copy = cloneInputs(original);
    copy.graph.nodes[0].id = "changed";
    expect(original.graph.nodes[0].id).not.toBe("changed");
  });

  it("runs all dynamic-programming modes", () => {
    expect(dpEngine.initialize({ problem: "edit-distance", stringA: "kit", stringB: "sit" }).states.at(-1)?.grid.at(-1)?.at(-1)).toBe(1);
    expect(dpEngine.initialize({ problem: "knapsack", items: [{ weight: 2, value: 3 }, { weight: 3, value: 4 }], capacity: 3 }).states.at(-1)?.grid.at(-1)?.at(-1)).toBe(4);
  });

  it("runs maze, subset-sum, Huffman, and trie insertion traces", () => {
    expect(backtrackingEngine.initialize({ problem: "maze", size: 3, mazeGrid: [[0, 0, 1], [1, 0, 1], [0, 0, 0]] }).states.at(-1)?.success).toBe(true);
    expect(backtrackingEngine.initialize({ problem: "subset-sum", size: 3, values: [3, 4, 5], targetSum: 7 }).states.at(-1)?.success).toBe(true);
    expect(greedyEngine.initialize({ problem: "huffman", text: "aabbbc", items: [] }).states.at(-1)?.complete).toBe(true);
    expect(triesEngine.initialize({ words: ["cat"], operation: "insert", insertWord: "car" }).states.at(-1)?.complete).toBe(true);
  });

  it("uses supplied treap priorities instead of random runtime state", () => {
    const run = treapsEngine.initialize({ nodes: [10, 20], treapPriorities: [1, 99], operation: "traverse", traversalOrder: "inorder" });
    const final = run.states.at(-1);
    expect(final?.rootId && final.nodes[final.rootId].priority).toBe(99);
  });

  it("shows only relevant random controls for strings and arrays", () => {
    const strings = randomControls("strings", defaultInputs("strings")).map(control => control.key);
    const arrays = randomControls("arrays", defaultInputs("arrays")).map(control => control.key);
    expect(strings).toEqual(["wordLength"]);
    expect(arrays).toContain("size");
    expect(arrays).not.toContain("wordLength");
  });

  it("randomizes the existing memory shape, addresses, values, and exact code-line count", () => {
    const current = cloneInputs(defaultInputs("pointers"));
    current.memory.variables.push({ name: "y", type: "int", value: "9", address: "0x1020" });
    current.memory.heapAllocations.push({ address: "0x5000", size: 4, value: "3", label: "buffer" });
    let value = 0;
    const generated = randomInputs("pointers", current, { min: 10, max: 30, codeLines: 5 }, () => (value = (value + 0.137) % 1));
    expect(generated.memory.variables).toHaveLength(3);
    expect(generated.memory.heapAllocations).toHaveLength(1);
    expect(generated.memory.statements).toHaveLength(5);
    const addresses = [...generated.memory.variables.map(variable => variable.address), ...generated.memory.heapAllocations.map(allocation => allocation.address)];
    expect(new Set(addresses).size).toBe(addresses.length);
    const pointer = generated.memory.variables.find(variable => variable.type.includes("*"));
    expect(addresses).toContain(pointer?.value);
    expect(generated.memory.variables.find(variable => variable.name === "y")?.value).not.toBe("9");
  });
});
