import { describe, expect, it } from "vitest";
import { arrayScenarios, graphScenario } from "@/lib/catalog";
import { bfsEngine, binarySearchEngine, dfsEngine, dijkstraEngine, insertionSortEngine } from "@/lib/engines";

describe("deterministic simulation engines", () => {
  it("computes Dijkstra shortest distances", () => {
    const run = dijkstraEngine.initialize(graphScenario);
    expect(run.states.at(-1)?.distances).toEqual({ A: 0, B: 3, C: 2, D: 8, E: 10, F: 13 });
    expect(run.events.at(-1)?.kind).toBe("complete");
  });

  it("rejects negative Dijkstra weights", () => {
    expect(() => dijkstraEngine.initialize({ ...graphScenario, edges: [{ id: "x", source: "A", target: "B", weight: -1 }] })).toThrow(/nonnegative/);
  });

  it("traverses BFS level-first with deterministic neighbors", () => {
    expect(bfsEngine.initialize(graphScenario).states.at(-1)?.traversal).toEqual(["A", "B", "C", "D", "E", "F"]);
  });

  it("traverses DFS using an explicit deterministic stack", () => {
    expect(dfsEngine.initialize(graphScenario).states.at(-1)?.traversal).toEqual(["A", "B", "D", "E", "F", "C"]);
  });

  it("finds a present target and terminates for an absent one", () => {
    expect(binarySearchEngine.initialize(arrayScenarios.binary_search).states.at(-1)?.found).toBe(5);
    expect(binarySearchEngine.initialize({ values: [1, 2, 4], target: 3 }).states.at(-1)?.found).toBeNull();
  });

  it("rejects unsorted binary-search input", () => {
    expect(() => binarySearchEngine.initialize({ values: [2, 1], target: 1 })).toThrow(/sorted/);
  });

  it("sorts duplicates, empty arrays, and standard input", () => {
    expect(insertionSortEngine.initialize({ values: [3, 1, 3, 2] }).states.at(-1)?.values).toEqual([1, 2, 3, 3]);
    expect(insertionSortEngine.initialize({ values: [] }).states.at(-1)?.values).toEqual([]);
    expect(insertionSortEngine.initialize(arrayScenarios.insertion_sort).states.at(-1)?.values).toEqual([2, 3, 4, 6, 7, 8]);
  });
});
