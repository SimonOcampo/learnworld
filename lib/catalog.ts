import type { ArrayScenario, CompiledLesson, ConceptId, GraphScenario, TemplateId } from "./types";

export const conceptMeta: Record<ConceptId, { label: string; description: string; template: TemplateId; color: string }> = {
  dijkstra: { label: "Dijkstra’s algorithm", description: "Find shortest paths through a weighted graph.", template: "graph", color: "#c9f66f" },
  bfs: { label: "Breadth-first search", description: "Explore a graph one level at a time.", template: "graph", color: "#8ed8c0" },
  dfs: { label: "Depth-first search", description: "Follow a path deeply, then backtrack.", template: "graph", color: "#ffb18f" },
  binary_search: { label: "Binary search", description: "Repeatedly halve a sorted search range.", template: "array", color: "#aeb8ff" },
  insertion_sort: { label: "Insertion sort", description: "Grow a sorted prefix one item at a time.", template: "array", color: "#ffd66b" },
  pointers: { label: "Pointers", description: "Trace addresses, aliases, dereferences, and pointer validity.", template: "memory", color: "#aeb8ff" },
  strings: { label: "Strings", description: "Explore character sequences, indexing, traversal, and termination.", template: "sequence", color: "#ffd66b" },
  arrays: { label: "Arrays", description: "Manipulate indexed contiguous data and reason about bounds.", template: "sequence", color: "#8ed8c0" },
  structures: { label: "Structures", description: "Group related fields and inspect their layout and access.", template: "memory", color: "#ffb18f" },
  dynamic_memory_allocation: { label: "Dynamic Memory Allocation", description: "Allocate and release heap memory while tracking ownership.", template: "memory", color: "#c9f66f" },
  recursion: { label: "Recursion", description: "Follow recursive calls, base cases, and return values through a call stack.", template: "call-stack", color: "#aeb8ff" },
  linked_lists: { label: "Linked Lists", description: "Insert, remove, and traverse nodes connected by links.", template: "linked", color: "#ffd66b" },
  skip_lists: { label: "Skip Lists", description: "Search layered linked lists with deterministic seeded levels.", template: "linked", color: "#8ed8c0" },
  stacks: { label: "Stacks", description: "Use last-in-first-out operations and trace the top element.", template: "linear-adt", color: "#ffb18f" },
  queues: { label: "Queues", description: "Use first-in-first-out operations and trace front and rear.", template: "linear-adt", color: "#c9f66f" },
  algorithm_analysis: { label: "Algorithm Analysis", description: "Count operations and compare resource use as inputs grow.", template: "complexity", color: "#aeb8ff" },
  growth_of_functions: { label: "Growth of Functions", description: "Compare how common functions grow as input size increases.", template: "complexity", color: "#ffd66b" },
  big_o: { label: "Big-O", description: "Reason about asymptotic upper bounds.", template: "complexity", color: "#8ed8c0" },
  big_omega: { label: "Big-Omega", description: "Reason about asymptotic lower bounds.", template: "complexity", color: "#ffb18f" },
  big_theta: { label: "Big-Theta", description: "Establish matching asymptotic upper and lower bounds.", template: "complexity", color: "#c9f66f" },
  binary_trees: { label: "Binary Trees", description: "Build binary trees and trace standard traversals.", template: "tree", color: "#aeb8ff" },
  binary_search_trees: { label: "Binary Search Trees", description: "Search and update trees while preserving key order.", template: "tree", color: "#ffd66b" },
  heaps: { label: "Heaps", description: "Maintain complete-tree shape and heap order.", template: "tree", color: "#8ed8c0" },
  tries: { label: "Tries", description: "Store and find keys by following shared prefixes.", template: "trie", color: "#ffb18f" },
  bitwise_operators: { label: "Bitwise Operators", description: "Apply masks, shifts, and Boolean operations to fixed-width values.", template: "bitwise", color: "#c9f66f" },
  avl_trees: { label: "AVL Trees", description: "Maintain BST order with height-balanced rotations.", template: "tree", color: "#aeb8ff" },
  b_trees: { label: "B-Trees", description: "Maintain multiway balanced search trees through splits and merges.", template: "tree", color: "#ffd66b" },
  red_black_trees: { label: "Red-Black Trees", description: "Restore color and structural invariants after tree updates.", template: "tree", color: "#8ed8c0" },
  treaps: { label: "Treaps", description: "Combine BST key order with heap priority order.", template: "tree", color: "#ffb18f" },
  master_theorem: { label: "Master Theorem", description: "Classify divide-and-conquer recurrences into Master Theorem cases.", template: "recurrence", color: "#c9f66f" },
  divide_and_conquer: { label: "Divide and Conquer Algorithms", description: "Decompose problems, solve subproblems, and combine results.", template: "recurrence", color: "#aeb8ff" },
  backtracking: { label: "Backtracking", description: "Explore choices, reject invalid partial solutions, and undo decisions.", template: "decision-tree", color: "#ffd66b" },
  bloom_filters: { label: "Bloom Filters", description: "Use a bitset and hashes to study membership and false positives.", template: "probabilistic", color: "#8ed8c0" },
  greedy_algorithms: { label: "Greedy Algorithms", description: "Choose local actions and test whether they produce an optimum.", template: "greedy", color: "#ffb18f" },
  dynamic_programming: { label: "Dynamic Programming", description: "Build solutions from overlapping subproblems and reconstruct choices.", template: "dp-grid", color: "#c9f66f" },
};

export const graphScenario: GraphScenario = {
  nodes: "ABCDEF".split("").map((id) => ({ id, label: id })),
  edges: [
    ["A", "B", 4], ["A", "C", 2], ["B", "C", 1], ["B", "D", 5],
    ["C", "D", 8], ["C", "E", 10], ["D", "E", 2], ["D", "F", 6], ["E", "F", 3],
  ].map(([source, target, weight], i) => ({ id: `e${i}`, source: String(source), target: String(target), weight: Number(weight) })),
  source: "A",
};

export const arrayScenarios: Record<"binary_search" | "insertion_sort", ArrayScenario> = {
  binary_search: { values: [3, 7, 11, 18, 24, 31, 42, 56, 63], target: 31 },
  insertion_sort: { values: [8, 3, 6, 2, 7, 4] },
};

export function fallbackLesson(concept: ConceptId): CompiledLesson {
  const meta = conceptMeta[concept];
  const objectives: Record<ConceptId, string> = {
    dijkstra: "Trace how tentative distances become final shortest paths through edge relaxation.",
    bfs: "Use a queue to explain why breadth-first search visits nodes level by level.",
    dfs: "Use a stack to trace deep exploration and backtracking through a graph.",
    binary_search: "Predict each midpoint and justify which half of the sorted range can be discarded.",
    insertion_sort: "Trace comparisons and shifts as a sorted prefix grows one value at a time.",
    pointers: "Predict the result of pointer assignments and dereferences.",
    strings: "Trace safe string traversal and mutation.",
    arrays: "Predict indexed reads and writes.",
    structures: "Trace structure field access and references.",
    dynamic_memory_allocation: "Identify valid, leaked, and dangling allocations.",
    recursion: "Trace calls and returns to a base case.",
    linked_lists: "Preserve links while changing a list.",
    skip_lists: "Trace a skip-list search across levels.",
    stacks: "Predict push and pop results.",
    queues: "Predict enqueue and dequeue results.",
    algorithm_analysis: "Derive and compare operation counts.",
    growth_of_functions: "Order common growth functions.",
    big_o: "Identify and justify asymptotic upper bounds.",
    big_omega: "Identify and justify asymptotic lower bounds.",
    big_theta: "Identify and justify tight asymptotic bounds.",
    binary_trees: "Predict binary-tree traversal order.",
    binary_search_trees: "Preserve the BST ordering invariant.",
    heaps: "Restore heap order after updates.",
    tries: "Trace insertion and prefix lookup.",
    bitwise_operators: "Predict bitwise operation results.",
    avl_trees: "Choose and apply the required AVL rotation.",
    b_trees: "Preserve B-tree occupancy and ordering invariants.",
    red_black_trees: "Repair red-black invariants after insertion.",
    treaps: "Preserve both treap invariants.",
    master_theorem: "Select and justify the applicable Master Theorem case.",
    divide_and_conquer: "Trace divide, solve, and combine phases.",
    backtracking: "Choose when to continue, prune, or undo.",
    bloom_filters: "Predict Bloom-filter insertion and query bits.",
    greedy_algorithms: "Evaluate a greedy-choice strategy.",
    dynamic_programming: "Fill a DP table in dependency order.",
  };
  return {
    concept,
    confidence: 1,
    title: meta.label,
    objective: objectives[concept],
    keyPoints: [meta.description, "The simulation is deterministic: each step follows the algorithm’s rules.", "Pause before each step and predict what changes next."],
    misconceptions: concept === "dijkstra" ? ["A tentative distance is not final until its node is settled."] : ["The visualization changes only when the algorithm performs a defined operation."],
    sourceNote: "Curated LearnWorld lesson",
  };
}

export function detectConcept(text: string): ConceptId {
  const value = text.toLowerCase();
  if (/dijkstra|shortest path|relax(ation|ing)?/.test(value)) return "dijkstra";
  if (/breadth.?first|\bbfs\b|level.?order/.test(value)) return "bfs";
  if (/depth.?first|\bdfs\b/.test(value)) return "dfs";
  if (/binary search|midpoint|sorted.+search/.test(value)) return "binary_search";
  if (/insertion sort|sorted prefix|shift.+key/.test(value)) return "insertion_sort";

  if (/dynamic programming|\bdp\b|memoiz|tabulat/.test(value)) return "dynamic_programming";
  if (/greedy/.test(value)) return "greedy_algorithms";
  if (/bloom/.test(value)) return "bloom_filters";
  if (/backtrack|prune|undo|maze/.test(value)) return "backtracking";
  if (/divide and conquer/.test(value)) return "divide_and_conquer";
  if (/master theorem/.test(value)) return "master_theorem";
  if (/skip list/.test(value)) return "skip_lists";
  if (/linked list/.test(value)) return "linked_lists";
  if (/red.?black/.test(value)) return "red_black_trees";
  if (/avl/.test(value)) return "avl_trees";
  if (/b.?tree/.test(value)) return "b_trees";
  if (/treap/.test(value)) return "treaps";
  if (/binary search tree|\bbst\b/.test(value)) return "binary_search_trees";
  if (/binary tree/.test(value)) return "binary_trees";
  if (/heap/.test(value)) return "heaps";
  if (/trie/.test(value)) return "tries";
  if (/bitwise|bit manipulation|mask/.test(value)) return "bitwise_operators";
  if (/theta|tight bound/.test(value)) return "big_theta";
  if (/omega|lower bound/.test(value)) return "big_omega";
  if (/big.?o|upper bound/.test(value)) return "big_o";
  if (/growth of functions|growth rate/.test(value)) return "growth_of_functions";
  if (/algorithm analysis|operation count/.test(value)) return "algorithm_analysis";
  if (/dynamic memory|malloc|free/.test(value)) return "dynamic_memory_allocation";
  if (/struct|field access/.test(value)) return "structures";
  if (/pointer|dereference|address|alias/.test(value)) return "pointers";
  if (/recursion|recursive|call stack/.test(value)) return "recursion";
  if (/stack/.test(value)) return "stacks";
  if (/queue/.test(value)) return "queues";
  if (/string|character/.test(value)) return "strings";
  if (/array/.test(value)) return "arrays";

  return "dijkstra";
}

export const previewTopics = ["Dynamic programming", "CPU pipelines", "Cache replacement", "Physics", "Economics", "Biology"];
