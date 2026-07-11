import { describe, expect, it } from "vitest";
import {
  pointersEngine,
  structuresEngine,
  dynamicMemoryEngine,
  stringsEngine,
  arraysEngine,
  recursionEngine,
  linkedListEngine,
  skipListEngine,
  stacksEngine,
  queuesEngine,
  algAnalysisEngine,
  growthOfFunctionsEngine,
  bigOEngine,
  bigOmegaEngine,
  bigThetaEngine,
  binaryTreesEngine,
  bstEngine,
  treeEngine,
  heapsEngine,
  avlEngine,
  btreeEngine,
  rbtEngine,
  treapsEngine,
  triesEngine,
  bitwiseEngine,
  masterTheoremEngine,
  divideAndConquerEngine,
  backtrackingEngine,
  bloomFilterEngine,
  greedyEngine,
  dpEngine
} from "@/lib/engines";

describe("Milestone 3 New Concept Engines", () => {
  describe("Memory family", () => {
    it("pointersEngine trace", () => {
      const run = pointersEngine.initialize({
        variables: [
          { name: "x", type: "int", value: "42", address: "0x1000" },
          { name: "p", type: "int*", value: "0x0000", address: "0x2000" }
        ],
        heapAllocations: [],
        statements: ["p = &x", "*p = 99"]
      });
      expect(run.states.length).toBe(3);
      expect(run.states[1].variables.find(v => v.name === "p")?.value).toBe("0x1000");
      expect(run.states[2].variables.find(v => v.name === "x")?.value).toBe("99");
      expect(run.events.length).toBe(2);
    });

    it("structuresEngine trace", () => {
      const run = structuresEngine.initialize({
        variables: [
          { name: "s.x", type: "int", value: "1", address: "0x1000" },
          { name: "p", type: "struct*", value: "0x1000", address: "0x2000" }
        ],
        heapAllocations: [],
        statements: ["s.x = 10", "p->x = 20"]
      });
      expect(run.states.length).toBe(3);
      expect(run.states[1].variables.find(v => v.name === "s.x")?.value).toBe("10");
      expect(run.states[2].variables.find(v => v.name === "s.x")?.value).toBe("20");
    });

    it("dynamicMemoryEngine trace", () => {
      const run = dynamicMemoryEngine.initialize({
        variables: [{ name: "p", type: "int*", value: "0x0000", address: "0x1000" }],
        heapAllocations: [],
        statements: ["p = malloc(4)", "free(p)"]
      });
      expect(run.states.length).toBe(3);
      expect(run.states[1].heapAllocations.length).toBe(1);
      expect(run.states[2].heapAllocations.length).toBe(0);
    });
  });

  describe("Sequence family", () => {
    it("stringsEngine trace with null terminator", () => {
      const run = stringsEngine.initialize({
        elements: ["a", "\0"],
        activeIndex: 0,
        operationType: "traverse"
      });
      expect(run.states.length).toBe(3);
      expect(run.states[2].complete).toBe(true);
      expect(run.events[1].message).toContain("null terminator");
    });

    it("arraysEngine trace for read and write", () => {
      const run = arraysEngine.initialize({
        elements: [10, 20, 30],
        activeIndex: 0,
        operationType: "write",
        targetIndex: 1,
        targetValue: 99
      });
      expect(run.states.at(-1)?.elements).toEqual([10, 99, 30]);
    });
  });

  describe("Recursion family", () => {
    it("recursionEngine trace factorial", () => {
      const run = recursionEngine.initialize({
        functionName: "factorial",
        initialArg: 3
      });
      expect(run.states.at(-1)?.returnValue).toBe(6);
      expect(run.states.at(-1)?.complete).toBe(true);
    });

    it("recursionEngine trace fibonacci", () => {
      const run = recursionEngine.initialize({
        functionName: "fibonacci",
        initialArg: 2
      });
      expect(run.states.at(-1)?.returnValue).toBe(1);
    });
  });

  describe("Linked family", () => {
    it("linkedListEngine trace", () => {
      const run = linkedListEngine.initialize({
        values: ["A", "B"],
        operation: "insert",
        operand: "C",
        position: 1
      });
      expect(run.states.at(-1)?.nodes.map(n => n.value)).toContain("C");
    });

    it("skipListEngine trace", () => {
      const run = skipListEngine.initialize({
        values: ["10", "20", "30", "40"],
        operation: "search",
        operand: "30"
      });
      expect(run.states.at(-1)?.complete).toBe(true);
    });
  });

  describe("Linear ADT family", () => {
    it("stacksEngine trace", () => {
      const run = stacksEngine.initialize({
        values: ["A"],
        operations: [{ type: "push", value: "B" }, { type: "pop" }]
      });
      expect(run.states[1].items).toEqual(["A", "B"]);
      expect(run.states[2].items).toEqual(["A"]);
    });

    it("queuesEngine trace", () => {
      const run = queuesEngine.initialize({
        values: ["A"],
        operations: [{ type: "enqueue", value: "B" }, { type: "dequeue" }]
      });
      expect(run.states[1].items).toEqual(["A", "B"]);
      expect(run.states[2].items).toEqual(["B"]);
    });
  });

  describe("Complexity family", () => {
    it("algAnalysisEngine trace", () => {
      const run = algAnalysisEngine.initialize({ f_n: "n^2", g_n: "n", n: 3 });
      expect(run.states.length).toBe(4);
    });

    it("growthOfFunctionsEngine trace", () => {
      const run = growthOfFunctionsEngine.initialize({ f_n: "n^2", g_n: "n" });
      expect(run.states.at(-1)?.complete).toBe(true);
    });

    it("bigOEngine trace", () => {
      const run = bigOEngine.initialize({ f_n: "n", g_n: "n^2", c: 1, n0: 2 });
      expect(run.states.at(-1)?.complete).toBe(true);
    });

    it("bigOmegaEngine trace", () => {
      const run = bigOmegaEngine.initialize({ f_n: "n^2", g_n: "n", c: 1, n0: 2 });
      expect(run.states.at(-1)?.complete).toBe(true);
    });

    it("bigThetaEngine trace", () => {
      const run = bigThetaEngine.initialize({ f_n: "2*n", g_n: "n", c: 3, n0: 2 });
      expect(run.states.at(-1)?.complete).toBe(true);
    });
  });

  describe("Tree family", () => {
    it("binaryTreesEngine trace", () => {
      const run = binaryTreesEngine.initialize({ nodes: [1, 2, 3], traversalOrder: "inorder" });
      expect(run.states.at(-1)?.traversalOrder).toEqual([2, 1, 3]);
    });

    it("bstEngine trace", () => {
      const run = bstEngine.initialize({ nodes: [10, 5, 15], searchTarget: 15 });
      expect(run.states.at(-1)?.traversalOrder).toEqual([15]);
    });

    it("heapsEngine trace", () => {
      const run = heapsEngine.initialize({ nodes: [10, 20], insertions: [5] });
      expect(run.states.at(-1)?.complete).toBe(true);
    });

    it("avlEngine trace", () => {
      const run = avlEngine.initialize({ nodes: [] });
      expect(run.states.at(-1)?.rootId).toBe("node_0");
    });

    it("unified tree engine supports binary and BST updates", () => {
      const binary = treeEngine.initialize({ treeType: "binary", nodes: [1, 2, 3], operation: "delete", deletions: [2] });
      const bst = treeEngine.initialize({ treeType: "bst", nodes: [10, 5, 15], operation: "insert", insertions: [12] });
      expect(Object.values(binary.states.at(-1)?.nodes ?? {}).map(node => node.value)).not.toContain(2);
      expect(Object.values(bst.states.at(-1)?.nodes ?? {}).map(node => node.value)).toContain(12);
    });

    it("heapsEngine extracts the normalized minimum", () => {
      const run = heapsEngine.initialize({ nodes: [9, 4, 7, 1], operation: "extract-min" });
      expect(run.events.some(event => event.message.includes("Extracted 1"))).toBe(true);
    });

    it("btreeEngine removes keys through the dynamic deletion path", () => {
      const run = btreeEngine.initialize({ nodes: [10, 20, 5, 6, 12, 30, 7, 17], operation: "delete", deletions: [10] });
      expect(run.states.at(-1)?.complete).toBe(true);
      expect(Object.values(run.states.at(-1)?.nodes ?? {}).flatMap(node => node.keys ?? [])).not.toContain(10);
    });

    it("rbtEngine deletes in-place and finishes with a black root", () => {
      const run = rbtEngine.initialize({ nodes: [10, 5, 15, 1, 7], operation: "delete", deletions: [5] });
      const final = run.states.at(-1);
      expect(final?.complete).toBe(true);
      expect(final?.rootId ? final.nodes[final.rootId].color : "black").toBe("black");
      expect(Object.values(final?.nodes ?? {}).map(node => node.value)).not.toContain(5);
    });

    it("btreeEngine trace", () => {
      const run = btreeEngine.initialize({ nodes: [] });
      expect(run.states.at(-1)?.complete).toBe(true);
    });

    it("rbtEngine trace", () => {
      const run = rbtEngine.initialize({ nodes: [] });
      expect(run.states.at(-1)?.complete).toBe(true);
    });

    it("treapsEngine trace", () => {
      const run = treapsEngine.initialize({ nodes: [] });
      expect(run.states.at(-1)?.complete).toBe(true);
    });
  });

  describe("Trie family", () => {
    it("triesEngine trace", () => {
      const run = triesEngine.initialize({ words: ["cat"], searchPrefix: "ca" });
      expect(run.states.at(-1)?.complete).toBe(true);
    });
  });

  describe("Bitwise family", () => {
    it("bitwiseEngine trace AND", () => {
      const run = bitwiseEngine.initialize({ operandA: 10, operandB: 12, operator: "AND", bits: 8 });
      expect(run.states.at(-1)?.result).toBe(8);
    });
  });

  describe("Recurrence family", () => {
    it("masterTheoremEngine trace", () => {
      const run = masterTheoremEngine.initialize({ a: 4, b: 2, fn: "n", n: 8 });
      expect(run.states.at(-1)?.applicableCase).toBe(1);
    });

    it("divideAndConquerEngine trace", () => {
      const run = divideAndConquerEngine.initialize({ a: 2, b: 2, fn: "n", n: 4 });
      expect(run.states.at(-1)?.complete).toBe(true);
    });
  });

  describe("Backtracking family", () => {
    it("backtrackingEngine trace n-queens", () => {
      const run = backtrackingEngine.initialize({ problem: "n-queens", size: 4 });
      expect(run.states.at(-1)?.success).toBe(true);
    });
  });

  describe("Bloom family", () => {
    it("bloomFilterEngine trace", () => {
      const run = bloomFilterEngine.initialize({ size: 8, hashes: 2, insertions: ["apple"], queries: ["apple", "banana"] });
      expect(run.states.at(-1)?.complete).toBe(true);
    });
  });

  describe("Greedy family", () => {
    it("greedyEngine trace knapsack", () => {
      const run = greedyEngine.initialize({
        problem: "knapsack",
        items: [{ id: "A", weight: 2, value: 10 }],
        capacity: 5
      });
      expect(run.states.at(-1)?.currentValue).toBe(10);
    });
  });

  describe("DP family", () => {
    it("dpEngine trace", () => {
      const run = dpEngine.initialize({ problem: "lcs", stringA: "BAT", stringB: "CAT" });
      expect(run.states.at(-1)?.complete).toBe(true);
    });
  });
});
