import { arrayScenarios, graphScenario } from "@/lib/catalog";
import {
  bfsEngine,
  binarySearchEngine,
  dfsEngine,
  dijkstraEngine,
  insertionSortEngine,
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
  dpEngine,
  type ArraySnapshot,
  type GraphSnapshot,
  type MemorySnapshot,
  type SequenceSnapshot,
  type CallStackSnapshot,
  type LinkedSnapshot,
  type LinearAdtSnapshot,
  type ComplexitySnapshot,
  type TreeSnapshot,
  type TrieSnapshot,
  type BitwiseSnapshot,
  type RecurrenceSnapshot,
  type BacktrackingSnapshot,
  type BloomSnapshot,
  type GreedySnapshot,
  type DPSnapshot
} from "@/lib/engines";
import type {
  ArrayScenario,
  ConceptId,
  GraphScenario,
  MemoryScenario,
  SequenceScenario,
  CallStackScenario,
  LinkedScenario,
  LinearAdtScenario,
  ComplexityScenario,
  TreeScenario,
  TrieScenario,
  BitwiseScenario,
  RecurrenceScenario,
  BacktrackingScenario,
  BloomScenario,
  GreedyScenario,
  DPScenario,
  SimulationRun,
  TemplateId
} from "@/lib/types";

export type RegisteredRun =
  | SimulationRun<GraphSnapshot>
  | SimulationRun<ArraySnapshot>
  | SimulationRun<MemorySnapshot>
  | SimulationRun<SequenceSnapshot>
  | SimulationRun<CallStackSnapshot>
  | SimulationRun<LinkedSnapshot>
  | SimulationRun<LinearAdtSnapshot>
  | SimulationRun<ComplexitySnapshot>
  | SimulationRun<TreeSnapshot>
  | SimulationRun<TrieSnapshot>
  | SimulationRun<BitwiseSnapshot>
  | SimulationRun<RecurrenceSnapshot>
  | SimulationRun<BacktrackingSnapshot>
  | SimulationRun<BloomSnapshot>
  | SimulationRun<GreedySnapshot>
  | SimulationRun<DPSnapshot>;

export type SimulationInputs = {
  graph: GraphScenario;
  array: ArrayScenario;
  memory: MemoryScenario;
  sequence: SequenceScenario;
  callStack: CallStackScenario;
  linked: LinkedScenario;
  linearAdt: LinearAdtScenario;
  complexity: ComplexityScenario;
  tree: TreeScenario;
  trie: TrieScenario;
  bitwise: BitwiseScenario;
  recurrence: RecurrenceScenario;
  backtracking: BacktrackingScenario;
  bloom: BloomScenario;
  greedy: GreedyScenario;
  dp: DPScenario;
};

export type EngineRegistration = { template: TemplateId; initialize(inputs: SimulationInputs): RegisteredRun };

export const engineRegistry: Partial<Record<ConceptId, EngineRegistration>> = {
  dijkstra: { template: "graph", initialize: ({ graph }) => dijkstraEngine.initialize(graph) },
  bfs: { template: "graph", initialize: ({ graph }) => bfsEngine.initialize(graph) },
  dfs: { template: "graph", initialize: ({ graph }) => dfsEngine.initialize(graph) },
  binary_search: { template: "array", initialize: ({ array }) => binarySearchEngine.initialize(array) },
  insertion_sort: { template: "array", initialize: ({ array }) => insertionSortEngine.initialize(array) },
  pointers: { template: "memory", initialize: ({ memory }) => pointersEngine.initialize(memory!) },
  structures: { template: "memory", initialize: ({ memory }) => structuresEngine.initialize(memory!) },
  dynamic_memory_allocation: { template: "memory", initialize: ({ memory }) => dynamicMemoryEngine.initialize(memory!) },
  strings: { template: "sequence", initialize: ({ sequence }) => stringsEngine.initialize(sequence!) },
  arrays: { template: "sequence", initialize: ({ sequence }) => arraysEngine.initialize(sequence!) },
  recursion: { template: "call-stack", initialize: ({ callStack }) => recursionEngine.initialize(callStack!) },
  linked_lists: { template: "linked", initialize: ({ linked }) => linkedListEngine.initialize(linked!) },
  skip_lists: { template: "linked", initialize: ({ linked }) => skipListEngine.initialize(linked!) },
  stacks: { template: "linear-adt", initialize: ({ linearAdt }) => stacksEngine.initialize(linearAdt!) },
  queues: { template: "linear-adt", initialize: ({ linearAdt }) => queuesEngine.initialize(linearAdt!) },
  algorithm_analysis: { template: "complexity", initialize: ({ complexity }) => algAnalysisEngine.initialize(complexity!) },
  growth_of_functions: { template: "complexity", initialize: ({ complexity }) => growthOfFunctionsEngine.initialize(complexity!) },
  big_o: { template: "complexity", initialize: ({ complexity }) => bigOEngine.initialize(complexity!) },
  big_omega: { template: "complexity", initialize: ({ complexity }) => bigOmegaEngine.initialize(complexity!) },
  big_theta: { template: "complexity", initialize: ({ complexity }) => bigThetaEngine.initialize(complexity!) },
  binary_trees: { template: "tree", initialize: ({ tree }) => treeEngine.initialize({ ...tree!, treeType: "binary" }) },
  binary_search_trees: { template: "tree", initialize: ({ tree }) => treeEngine.initialize({ ...tree!, treeType: "bst" }) },
  heaps: { template: "tree", initialize: ({ tree }) => heapsEngine.initialize(tree!) },
  tries: { template: "trie", initialize: ({ trie }) => triesEngine.initialize(trie!) },
  bitwise_operators: { template: "bitwise", initialize: ({ bitwise }) => bitwiseEngine.initialize(bitwise!) },
  avl_trees: { template: "tree", initialize: ({ tree }) => avlEngine.initialize(tree!) },
  b_trees: { template: "tree", initialize: ({ tree }) => btreeEngine.initialize(tree!) },
  red_black_trees: { template: "tree", initialize: ({ tree }) => rbtEngine.initialize(tree!) },
  treaps: { template: "tree", initialize: ({ tree }) => treapsEngine.initialize(tree!) },
  master_theorem: { template: "recurrence", initialize: ({ recurrence }) => masterTheoremEngine.initialize(recurrence!) },
  divide_and_conquer: { template: "recurrence", initialize: ({ recurrence }) => divideAndConquerEngine.initialize(recurrence!) },
  backtracking: { template: "decision-tree", initialize: ({ backtracking }) => backtrackingEngine.initialize(backtracking!) },
  bloom_filters: { template: "probabilistic", initialize: ({ bloom }) => bloomFilterEngine.initialize(bloom!) },
  greedy_algorithms: { template: "greedy", initialize: ({ greedy }) => greedyEngine.initialize(greedy!) },
  dynamic_programming: { template: "dp-grid", initialize: ({ dp }) => dpEngine.initialize(dp!) },
};

const defaultMemory: MemoryScenario = {
  variables: [
    { name: "x", type: "int", value: "42", address: "0x1000" },
    { name: "p", type: "int*", value: "0x0000", address: "0x2000" }
  ],
  heapAllocations: [],
  statements: ["p = &x", "*p = 99"]
};

const defaultSequence: SequenceScenario = {
  elements: ["a", "b", "c", "\0"],
  activeIndex: 0,
  operationType: "traverse"
};

const defaultCallStack: CallStackScenario = {
  functionName: "factorial",
  initialArg: 3
};

const defaultLinked: LinkedScenario = {
  values: ["10", "20", "30"],
  operation: "search",
  operand: "20"
};

const defaultLinearAdt: LinearAdtScenario = {
  values: ["A", "B"],
  operations: [
    { type: "push", value: "C" },
    { type: "pop" }
  ]
};

const defaultComplexity: ComplexityScenario = {
  f_n: "n",
  g_n: "n^2",
  c: 1,
  n0: 2
};

const defaultTree: TreeScenario = {
  nodes: [10, 5, 15, 2, 7, 12, 20],
  operation: "search",
  searchTarget: 12,
  traversalOrder: "inorder",
  treeType: "bst"
};

const defaultTrie: TrieScenario = {
  words: ["cat", "car"],
  searchPrefix: "ca"
};

const defaultBitwise: BitwiseScenario = {
  operandA: 10,
  operandB: 12,
  operator: "AND",
  bits: 8
};

const defaultRecurrence: RecurrenceScenario = {
  a: 2,
  b: 2,
  fn: "n",
  n: 8
};

const defaultBacktracking: BacktrackingScenario = {
  problem: "n-queens",
  size: 4
};

const defaultBloom: BloomScenario = {
  size: 8,
  hashes: 2,
  insertions: ["apple"],
  queries: ["apple", "banana"]
};

const defaultGreedy: GreedyScenario = {
  problem: "knapsack",
  items: [
    { id: "A", weight: 2, value: 10 },
    { id: "B", weight: 3, value: 12 }
  ],
  capacity: 5
};

const defaultDP: DPScenario = {
  problem: "lcs",
  stringA: "BAT",
  stringB: "CAT"
};

export function defaultInputs(concept: ConceptId): SimulationInputs {
  return {
    graph: graphScenario,
    array: concept === "insertion_sort" ? arrayScenarios.insertion_sort : arrayScenarios.binary_search,
    memory: defaultMemory,
    sequence: defaultSequence,
    callStack: defaultCallStack,
    linked: defaultLinked,
    linearAdt: defaultLinearAdt,
    complexity: defaultComplexity,
    tree: {
      ...defaultTree,
      operation: concept === "heaps" || concept === "b_trees" ? "insert" : defaultTree.operation,
      btreeOrder: concept === "b_trees" ? 2 : defaultTree.btreeOrder,
    },
    trie: defaultTrie,
    bitwise: defaultBitwise,
    recurrence: defaultRecurrence,
    backtracking: defaultBacktracking,
    bloom: defaultBloom,
    greedy: defaultGreedy,
    dp: defaultDP,
  };
}

export function validateRegistration(concept: ConceptId) {
  const registration = engineRegistry[concept];
  if (!registration) throw new Error(`Unsupported deterministic engine: ${concept}`);
  return registration;
}
