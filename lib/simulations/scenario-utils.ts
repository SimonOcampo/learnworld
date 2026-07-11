import type { SimulationInputs } from "./registry";
import type { ConceptId, GraphEdge, GraphNode } from "../types";

export type RandomSettings = {
  size: number;
  min: number;
  max: number;
  density: number;
  wordLength: number;
  codeLines: number;
};

export type RandomControl = { key: keyof RandomSettings; label: string; min?: number; max?: number };

export type ScenarioValidation = Record<string, string>;

export const defaultRandomSettings: RandomSettings = {
  size: 5,
  min: 1,
  max: 50,
  density: 45,
  wordLength: 4,
  codeLines: 3,
};

export function randomControls(concept: ConceptId, inputs: SimulationInputs): RandomControl[] {
  if (["pointers", "structures", "dynamic_memory_allocation"].includes(concept)) return [
    { key: "min", label: "Value min" }, { key: "max", label: "Value max" }, { key: "codeLines", label: "Code lines", min: 1, max: 12 },
  ];
  if (concept === "strings") return [{ key: "wordLength", label: "String length", min: 1, max: 20 }];
  if (concept === "arrays" || concept === "insertion_sort" || concept === "binary_search") return [{ key: "size", label: "Element count", min: 1, max: 20 }, { key: "min", label: "Value min" }, { key: "max", label: "Value max" }];
  if (["dijkstra", "bfs", "dfs"].includes(concept)) return [{ key: "size", label: "Node count", min: 2, max: 10 }, { key: "density", label: "Edge density", min: 10, max: 100 }, { key: "min", label: "Weight min" }, { key: "max", label: "Weight max" }];
  if (concept === "tries") return [{ key: "size", label: "Word count", min: 1, max: 12 }, { key: "wordLength", label: "Word length", min: 1, max: 12 }];
  if (["binary_trees", "binary_search_trees", "heaps", "avl_trees", "b_trees", "red_black_trees", "treaps", "linked_lists", "skip_lists"].includes(concept)) return [{ key: "size", label: "Item count", min: 1, max: 12 }, { key: "min", label: "Value min" }, { key: "max", label: "Value max" }];
  if (["stacks", "queues", "subset-sum"].includes(concept)) return [{ key: "size", label: "Item count", min: 1, max: 10 }, { key: "min", label: "Value min" }, { key: "max", label: "Value max" }];
  if (concept === "backtracking") return inputs.backtracking.problem === "maze" ? [{ key: "size", label: "Maze size", min: 3, max: 8 }, { key: "density", label: "Wall density", min: 10, max: 60 }] : [{ key: "size", label: inputs.backtracking.problem === "n-queens" ? "Board size" : "Item count", min: inputs.backtracking.problem === "n-queens" ? 4 : 1, max: 8 }, { key: "min", label: "Value min" }, { key: "max", label: "Value max" }];
  if (concept === "bloom_filters") return [{ key: "size", label: "Word count", min: 1, max: 12 }, { key: "wordLength", label: "Word length", min: 1, max: 12 }];
  if (concept === "greedy_algorithms") return inputs.greedy.problem === "huffman" ? [{ key: "wordLength", label: "Text length", min: 2, max: 30 }] : [{ key: "size", label: "Item count", min: 1, max: 12 }, { key: "min", label: "Value min" }, { key: "max", label: "Value max" }];
  if (concept === "dynamic_programming") return inputs.dp.problem === "knapsack" ? [{ key: "size", label: "Item count", min: 1, max: 10 }, { key: "min", label: "Value min" }, { key: "max", label: "Value max" }] : [{ key: "wordLength", label: "String length", min: 1, max: 12 }];
  if (concept === "bitwise_operators") return [{ key: "min", label: "Operand min" }, { key: "max", label: "Operand max" }];
  if (["master_theorem", "divide_and_conquer", "recursion", "algorithm_analysis", "growth_of_functions", "big_o", "big_omega", "big_theta"].includes(concept)) return [{ key: "min", label: "Minimum n", min: 1 }, { key: "max", label: "Maximum n", min: 2 }];
  return [];
}

export function cloneInputs(inputs: SimulationInputs): SimulationInputs {
  return JSON.parse(JSON.stringify(inputs)) as SimulationInputs;
}

const numberIn = (random: () => number, min: number, max: number) => Math.floor(random() * (max - min + 1)) + min;
const pick = <T,>(random: () => number, items: T[]) => items[numberIn(random, 0, items.length - 1)];
const uniqueNumbers = (random: () => number, count: number, min: number, max: number) => {
  const span = Math.max(1, max - min + 1);
  const needed = Math.min(count, span);
  const offset = numberIn(random, 0, span - 1);
  return Array.from({ length: needed }, (_, index) => min + ((offset + index) % span));
};
const randomWord = (random: () => number, length: number) => Array.from({ length }, () => String.fromCharCode(97 + numberIn(random, 0, 25))).join("");

function randomGraph(random: () => number, settings: RandomSettings) {
  const count = Math.max(2, Math.min(10, settings.size));
  const nodes: GraphNode[] = Array.from({ length: count }, (_, index) => {
    const id = String.fromCharCode(65 + index);
    return { id, label: id };
  });
  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const add = (a: string, b: string) => {
    const key = [a, b].sort().join("-");
    if (seen.has(key)) return;
    seen.add(key);
    edges.push({ id: `e${edges.length}`, source: a, target: b, weight: numberIn(random, Math.max(0, settings.min), Math.max(1, settings.max)) });
  };
  for (let index = 1; index < nodes.length; index++) add(nodes[index - 1].id, nodes[index].id);
  const possible = count * (count - 1) / 2;
  const desired = Math.max(count - 1, Math.min(possible, Math.round(possible * settings.density / 100)));
  const candidates: [string, string][] = [];
  for (let left = 0; left < nodes.length; left++) for (let right = left + 1; right < nodes.length; right++) candidates.push([nodes[left].id, nodes[right].id]);
  for (const [left, right] of candidates.sort(() => random() - 0.5)) {
    if (edges.length >= desired) break;
    add(left, right);
  }
  return { nodes, edges, source: nodes[0].id };
}

/** Generates a fresh, valid draft. The optional RNG is intentionally only for tests. */
export function randomInputs(concept: ConceptId, current: SimulationInputs, rawSettings: Partial<RandomSettings> = {}, random: () => number = Math.random): SimulationInputs {
  const settings = { ...defaultRandomSettings, ...rawSettings };
  const inputs = cloneInputs(current);
  const size = Math.max(1, Math.min(10, Math.floor(settings.size)));
  const min = Math.min(settings.min, settings.max);
  const max = Math.max(settings.min, settings.max);
  const values = uniqueNumbers(random, size, min, max);

  if (["dijkstra", "bfs", "dfs"].includes(concept)) inputs.graph = randomGraph(random, settings);
  if (concept === "binary_search") {
    const sorted = [...values].sort((a, b) => a - b);
    inputs.array = { values: sorted, target: pick(random, sorted) };
  }
  if (concept === "insertion_sort") inputs.array = { values: Array.from({ length: size }, () => numberIn(random, min, max)) };
  if (["pointers", "structures", "dynamic_memory_allocation"].includes(concept)) {
    const used = new Set<string>();
    let addressOffset = numberIn(random, 0, 0xEFF);
    const nextAddress = () => {
      let address: string;
      do { address = `0x${(0x1000 + (addressOffset++ % 0xF00) * 16).toString(16).toUpperCase()}`; } while (used.has(address));
      used.add(address);
      return address;
    };
    const variables = inputs.memory.variables.map(variable => ({ ...variable, address: nextAddress(), value: String(numberIn(random, min, max)) }));
    const heapAllocations = inputs.memory.heapAllocations.map(allocation => ({ ...allocation, address: nextAddress(), size: numberIn(random, 1, 8), value: String(numberIn(random, min, max)) }));
    const pointer = variables.find(variable => variable.type.includes("*"));
    const targets = variables.filter(variable => !variable.type.includes("*"));
    if (pointer) pointer.value = targets.length ? pick(random, targets).address : heapAllocations[0]?.address ?? "0x0000";
    const statementCount = Math.max(1, Math.min(12, Math.floor(settings.codeLines)));
    const scalar = targets[0];
    const field = targets.find(variable => variable.name.includes("."));
    if (concept === "structures" && pointer && field) pointer.value = field.address;
    const statements: string[] = [];
    for (let index = 0; index < statementCount; index++) {
      const value = numberIn(random, min, max);
      if (concept === "dynamic_memory_allocation" && pointer) {
        const phase = index % 3;
        statements.push(phase === 0 ? `${pointer.name} = malloc(4)` : phase === 1 ? `*${pointer.name} = ${value}` : `free(${pointer.name})`);
      } else if (concept === "structures" && field) {
        statements.push(pointer ? index % 2 ? `${field.name} = ${value}` : `${pointer.name}->${field.name.split(".").at(-1)} = ${value}` : `${field.name} = ${value}`);
      } else if (pointer && scalar) {
        statements.push(index % 2 ? `*${pointer.name} = ${value}` : `${pointer.name} = &${scalar.name}`);
      } else if (scalar) {
        statements.push(`${scalar.name} = ${value}`);
      }
    }
    inputs.memory = { variables, heapAllocations, statements };
  }
  if (["strings", "arrays"].includes(concept)) {
    const elements = concept === "strings" ? [...randomWord(random, Math.max(1, settings.wordLength)), "\0"] : Array.from({ length: size }, () => numberIn(random, min, max));
    inputs.sequence = { ...inputs.sequence, elements, targetIndex: numberIn(random, 0, elements.length - 1), targetValue: concept === "strings" ? "z" : numberIn(random, min, max) };
  }
  if (concept === "recursion") inputs.callStack = { ...inputs.callStack, initialArg: numberIn(random, 1, 7) };
  if (["linked_lists", "skip_lists"].includes(concept)) inputs.linked = { ...inputs.linked, values: values.map(String), operand: String(pick(random, values)), position: numberIn(random, 0, values.length - 1), levels: numberIn(random, 2, 4) };
  if (["stacks", "queues"].includes(concept)) {
    const isStack = concept === "stacks";
    inputs.linearAdt = { values: values.slice(0, 3).map(String), operations: [{ type: isStack ? "push" : "enqueue", value: "X" }, { type: isStack ? "pop" : "dequeue" }] };
  }
  if (["algorithm_analysis", "growth_of_functions", "big_o", "big_omega", "big_theta"].includes(concept)) inputs.complexity = { f_n: pick(random, ["1", "log n", "n", "n log n", "n^2"]), g_n: pick(random, ["n", "n log n", "n^2"]), c: numberIn(random, 1, 5), n0: numberIn(random, 1, 10), n: size };
  if (["binary_trees", "binary_search_trees", "heaps", "avl_trees", "b_trees", "red_black_trees", "treaps"].includes(concept)) {
    const treeValues = concept === "binary_trees" ? Array.from({ length: size }, () => numberIn(random, min, max)) : values;
    inputs.tree = { ...inputs.tree, nodes: treeValues, searchTarget: pick(random, treeValues), traversalOrder: pick(random, ["inorder", "preorder", "postorder"]), btreeOrder: numberIn(random, 2, 4), treapPriorities: Array.from({ length: treeValues.length }, () => numberIn(random, 1, 99)), operationPriority: numberIn(random, 1, 99) };
  }
  if (concept === "tries") inputs.trie = { ...inputs.trie, words: Array.from({ length: size }, () => randomWord(random, settings.wordLength)), searchPrefix: randomWord(random, Math.max(1, settings.wordLength - 1)), insertWord: randomWord(random, settings.wordLength) };
  if (concept === "bitwise_operators") inputs.bitwise = { operandA: numberIn(random, 0, 255), operandB: numberIn(random, 0, 7), operator: pick(random, ["AND", "OR", "XOR", "NOT", "SHL", "SHR"]), bits: pick(random, [8, 16, 32]) };
  if (["master_theorem", "divide_and_conquer"].includes(concept)) inputs.recurrence = { a: numberIn(random, 1, 4), b: numberIn(random, 2, 4), fn: pick(random, ["1", "log n", "n", "n^2"]), n: 2 ** numberIn(random, 2, 5) };
  if (concept === "backtracking") {
    const problem = inputs.backtracking.problem;
    inputs.backtracking = problem === "maze"
      ? { problem, size: 5, mazeGrid: [[0, 0, 1, 0, 0], [1, 0, 1, 0, 1], [0, 0, 0, 0, 0], [0, 1, 1, 1, 0], [0, 0, 0, 0, 0]] }
      : problem === "subset-sum"
        ? { problem, size, values, targetSum: values.slice(0, Math.max(1, Math.floor(values.length / 2))).reduce((sum, value) => sum + value, 0) }
        : { problem, size: Math.max(4, Math.min(8, size)) };
  }
  if (concept === "bloom_filters") inputs.bloom = { size: Math.max(4, size * 2), hashes: numberIn(random, 1, 4), insertions: Array.from({ length: Math.max(1, Math.floor(size / 2)) }, () => randomWord(random, settings.wordLength)), queries: Array.from({ length: 2 }, () => randomWord(random, settings.wordLength)) };
  if (concept === "greedy_algorithms") {
    inputs.greedy = { ...inputs.greedy, capacity: numberIn(random, Math.max(1, min), Math.max(2, max)), items: values.map((value, index) => ({ id: inputs.greedy.items[index]?.id ?? String.fromCharCode(65 + index), weight: Math.max(1, value % 10), value, start: index * 2, end: index * 2 + numberIn(random, 1, 4) })), text: randomWord(random, Math.max(4, settings.wordLength * 2)) };
  }
  if (concept === "dynamic_programming") {
    inputs.dp = { ...inputs.dp, stringA: randomWord(random, settings.wordLength), stringB: randomWord(random, settings.wordLength), items: values.map(value => ({ weight: Math.max(1, value % 8), value })), capacity: numberIn(random, Math.max(2, min), Math.max(3, max)) };
  }
  return inputs;
}

export function validateInputs(concept: ConceptId, inputs: SimulationInputs): ScenarioValidation {
  const errors: ScenarioValidation = {};
  const unique = (items: string[]) => new Set(items).size === items.length;
  if (["dijkstra", "bfs", "dfs"].includes(concept)) {
    if (!inputs.graph.nodes.length) errors.graph = "Add at least one node.";
    if (!unique(inputs.graph.nodes.map(node => node.id))) errors.graph = "Node IDs must be unique.";
    if (!inputs.graph.nodes.some(node => node.id === inputs.graph.source)) errors.graph = "Choose an existing start node.";
    if (inputs.graph.edges.some(edge => !inputs.graph.nodes.some(node => node.id === edge.source) || !inputs.graph.nodes.some(node => node.id === edge.target))) errors.graph = "Every edge must reference an existing node.";
    if (concept === "dijkstra" && inputs.graph.edges.some(edge => edge.weight < 0)) errors.graph = "Dijkstra requires nonnegative weights.";
  }
  if (["pointers", "structures", "dynamic_memory_allocation"].includes(concept)) {
    const variables = inputs.memory.variables;
    const addresses = [...variables.map(variable => variable.address), ...inputs.memory.heapAllocations.map(allocation => allocation.address)];
    if (!unique(variables.map(variable => variable.name))) errors.memory = "Variable names must be unique.";
    else if (!unique(addresses)) errors.memory = "Variable and heap addresses must be unique.";
    else if (concept === "pointers" && (!variables.some(variable => variable.type.includes("*")) || !variables.some(variable => !variable.type.includes("*")))) errors.memory = "Add both a pointer variable and a value variable to generate valid code.";
    else if (concept === "dynamic_memory_allocation" && !variables.some(variable => variable.type.includes("*"))) errors.memory = "Add a pointer variable to generate allocation code.";
  }
  if (concept === "binary_search" && inputs.array.values.some((value, index, list) => index > 0 && value < list[index - 1])) errors.array = "Binary search requires sorted values.";
  if (["strings", "arrays"].includes(concept) && !inputs.sequence.elements.length) errors.sequence = "Add at least one element.";
  if (inputs.sequence.targetIndex !== undefined && (inputs.sequence.targetIndex < 0 || inputs.sequence.targetIndex >= inputs.sequence.elements.length)) errors.sequence = "Target index is outside the sequence.";
  if (inputs.sequence.activeIndex !== undefined && (inputs.sequence.activeIndex < 0 || inputs.sequence.activeIndex >= inputs.sequence.elements.length)) errors.sequence = "Active index is outside the sequence.";
  if (["linked_lists", "skip_lists"].includes(concept) && !inputs.linked.values.length) errors.linked = "Add at least one linked-list value.";
  if (["stacks", "queues"].includes(concept) && inputs.linearAdt.operations.some(operation => (operation.type === "push" || operation.type === "enqueue") && !operation.value)) errors.linearAdt = "Push and enqueue operations need a value.";
  if (["binary_trees", "binary_search_trees", "heaps", "avl_trees", "b_trees", "red_black_trees", "treaps"].includes(concept)) {
    if (inputs.tree.btreeOrder !== undefined && inputs.tree.btreeOrder < 2) errors.tree = "B-tree degree must be at least 2.";
    if (inputs.tree.treapPriorities && inputs.tree.treapPriorities.length !== inputs.tree.nodes.length) errors.tree = "Treap priorities must match the number of nodes.";
  }
  if (concept === "tries" && inputs.trie.operation === "insert" && !inputs.trie.insertWord) errors.trie = "Provide a word to insert.";
  if (concept === "backtracking") {
    if (inputs.backtracking.problem === "n-queens" && (inputs.backtracking.size < 4 || inputs.backtracking.size > 8)) errors.backtracking = "N-Queens supports board sizes 4 through 8.";
    if (inputs.backtracking.problem === "maze" && (!inputs.backtracking.mazeGrid?.length || inputs.backtracking.mazeGrid.some(row => row.length !== inputs.backtracking.mazeGrid!.length))) errors.backtracking = "Maze must be a square grid.";
    if (inputs.backtracking.problem === "subset-sum" && (!inputs.backtracking.values?.length || inputs.backtracking.targetSum === undefined)) errors.backtracking = "Subset sum needs values and a target.";
  }
  if (concept === "bloom_filters" && (inputs.bloom.size < 2 || inputs.bloom.hashes < 1)) errors.bloom = "Bloom size must be at least 2 and hashes at least 1.";
  if (concept === "greedy_algorithms" && inputs.greedy.problem === "knapsack" && inputs.greedy.items.some(item => item.weight <= 0)) errors.greedy = "Knapsack weights must be positive.";
  if (concept === "dynamic_programming" && inputs.dp.problem === "knapsack" && (!inputs.dp.items?.length || !inputs.dp.capacity || inputs.dp.capacity < 1)) errors.dp = "DP knapsack needs items and a positive capacity.";
  return errors;
}
