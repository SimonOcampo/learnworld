# Technical Proposal: LearnWorld 30 Simulations Upgrade

This document outlines the architectural plan to convert the 30 guided-visual skills in LearnWorld's CS1/CS2 curriculum catalog to fully interactive, user-customizable simulations. 

---

## 1. Executive Summary
LearnWorld currently supports two fully interactive simulation engines (`dijkstra` for Graph Algorithms, `insertion-sort` for Sorting) and delegates the remaining 30 skills to a simplified, text-based `GuidedSimulation` layout. To provide a rich, interactive learning experience across all 32 curriculum areas, this proposal recommends:
- Extending the capability schema from `guided-visual` to `full-interactive`.
- Creating a modular simulation engine structure where execution code is grouped in family-specific engine files under `lib/simulations/engines/`.
- Creating customized UI inputs and visualizer components for each family of skills to satisfy the **R2 (User-Customizable Inputs)** requirement.
- Modifying `SimulationShell.tsx`, `registry.ts`, and schema files to integrate these changes cleanly.

---

## 2. Modular Engine File Structure
Rather than adding 30 new engines directly to `lib/engines.ts` (which would result in a massive, unmaintainable monolithic file of >5,000 lines), we recommend a **modular, family-based directory structure**. 

We will place new simulation engines in `lib/simulations/engines/` grouped by their conceptual family. This maps to the existing `.config.family` layout in `catalog.json`.

```
lib/
├── engines.ts                  # Central index exporting all engines
├── simulations/
│   ├── engines/
│   │   ├── memoryEngine.ts      # pointers, structures, dynamic-memory-allocation
│   │   ├── sequenceEngine.ts    # strings, arrays
│   │   ├── recursionEngine.ts   # recursion
│   │   ├── linkedEngine.ts      # linked-lists, skip-lists
│   │   ├── linearAdtEngine.ts   # stacks, queues
│   │   ├── complexityEngine.ts  # algorithm-analysis, growth-of-functions, big-o, etc.
│   │   ├── treeEngine.ts        # binary-trees, bst, heaps, avl, red-black, treaps
│   │   ├── trieEngine.ts        # tries
│   │   ├── bitwiseEngine.ts     # bitwise-operators
│   │   ├── recurrenceEngine.ts  # master-theorem, divide-and-conquer
│   │   ├── backtrackingEngine.ts# backtracking
│   │   ├── bloomEngine.ts       # bloom-filters
│   │   ├── greedyEngine.ts      # greedy-algorithms
│   │   └── dpEngine.ts          # dynamic-programming
```

### Exposing Engines via Central Index
In `lib/engines.ts`, we export the modules and register them:
```typescript
// lib/engines.ts
export * from "./simulations/engines/memoryEngine";
export * from "./simulations/engines/sequenceEngine";
export * from "./simulations/engines/recursionEngine";
export * from "./simulations/engines/linkedEngine";
export * from "./simulations/engines/linearAdtEngine";
export * from "./simulations/engines/complexityEngine";
export * from "./simulations/engines/treeEngine";
export * from "./simulations/engines/trieEngine";
export * from "./simulations/engines/bitwiseEngine";
export * from "./simulations/engines/recurrenceEngine";
export * from "./simulations/engines/backtrackingEngine";
export * from "./simulations/engines/bloomEngine";
export * from "./simulations/engines/greedyEngine";
export * from "./simulations/engines/dpEngine";

// Maintain central registry export
export const engines = {
  dijkstra: dijkstraEngine,
  bfs: bfsEngine,
  dfs: dfsEngine,
  binary_search: binarySearchEngine,
  insertion_sort: insertionSortEngine,
  // 30 new engines...
  pointers: pointersEngine,
  strings: stringsEngine,
  arrays: arraysEngine,
  structures: structuresEngine,
  "dynamic-memory-allocation": dynamicMemoryEngine,
  recursion: recursionEngine,
  "linked-lists": linkedListEngine,
  "skip-lists": skipListEngine,
  stacks: stacksEngine,
  queues: queuesEngine,
  "algorithm-analysis": algAnalysisEngine,
  "growth-of-functions": growthOfFunctionsEngine,
  "big-o": bigOEngine,
  "big-omega": bigOmegaEngine,
  "big-theta": bigThetaEngine,
  "binary-trees": binaryTreesEngine,
  "binary-search-trees": bstEngine,
  heaps: heapsEngine,
  tries: triesEngine,
  "bitwise-operators": bitwiseEngine,
  "avl-trees": avlEngine,
  "b-trees": btreeEngine,
  "red-black-trees": rbtEngine,
  treaps: treapsEngine,
  "master-theorem": masterTheoremEngine,
  "divide-and-conquer": divideAndConquerEngine,
  backtracking: backtrackingEngine,
  "bloom-filters": bloomFilterEngine,
  "greedy-algorithms": greedyEngine,
  "dynamic-programming": dpEngine,
};
```

---

## 3. Schema & Type Modifications
We must update `lib/types.ts` and `lib/schemas/skill.ts` to include the new concept IDs, engine enums, and support visualizer state shapes.

### 3.1 `lib/types.ts`
We extend the lists of Concept IDs and define the new Template IDs, Scenario types, and Snapshot shapes:

```typescript
// lib/types.ts

export const conceptIds = [
  "dijkstra", "bfs", "dfs", "binary_search", "insertion_sort",
  "pointers", "strings", "arrays", "structures", "dynamic_memory_allocation",
  "recursion", "linked_lists", "skip_lists", "stacks", "queues",
  "algorithm_analysis", "growth_of_functions", "big_o", "big_omega", "big_theta",
  "binary_trees", "binary_search_trees", "heaps", "tries", "bitwise_operators",
  "avl_trees", "b_trees", "red_black_trees", "treaps", "master_theorem",
  "divide_and_conquer", "backtracking", "bloom_filters", "greedy_algorithms",
  "dynamic_programming"
] as const;

export type ConceptId = (typeof conceptIds)[number];

export type TemplateId =
  | "graph"
  | "array"
  | "memory"
  | "sequence"
  | "call-stack"
  | "linked"
  | "linear-adt"
  | "complexity"
  | "tree"
  | "trie"
  | "bitwise"
  | "recurrence"
  | "decision-tree"
  | "probabilistic"
  | "greedy"
  | "dp-grid";

// Extension to support customizable inputs for all scenarios
export type MemoryScenario = {
  variables: { name: string; type: string; value: string; address: string }[];
  heapAllocations: { address: string; size: number; value: string; label?: string }[];
  statements: string[];
};

export type SequenceScenario = {
  elements: (string | number)[];
  activeIndex?: number;
  operationType: "read" | "write" | "traverse";
  targetIndex?: number;
  targetValue?: string | number;
};

export type CallStackScenario = {
  functionName: string;
  initialArg: number;
};

export type LinkedScenario = {
  values: string[];
  operation: "insert" | "delete" | "search" | "reverse";
  operand?: string;
  position?: number;
  levels?: number; // Skip lists
};

export type LinearAdtScenario = {
  values: string[];
  operations: { type: "push" | "pop" | "enqueue" | "dequeue"; value?: string }[];
};

export type ComplexityScenario = {
  f_n: string;
  g_n: string;
  c?: number;
  n0?: number;
  codeSnippet?: string;
  n?: number;
};

export type TreeScenario = {
  nodes: (string | number | null)[];
  insertions?: (string | number)[];
  deletions?: (string | number)[];
  searchTarget?: string | number;
  traversalOrder?: "preorder" | "inorder" | "postorder";
  treeType?: "binary" | "bst" | "heap" | "avl" | "red-black" | "treap" | "btree";
  btreeOrder?: number;
};

export type TrieScenario = {
  words: string[];
  searchPrefix?: string;
  insertWord?: string;
};

export type BitwiseScenario = {
  operandA: number;
  operandB?: number;
  operator: "AND" | "OR" | "XOR" | "NOT" | "SHL" | "SHR";
  bits: 8 | 16 | 32;
};

export type RecurrenceScenario = {
  a: number;
  b: number;
  fn: string;
  n: number;
};

export type BacktrackingScenario = {
  problem: "n-queens" | "maze" | "subset-sum";
  size: number;
  mazeGrid?: number[][];
};

export type BloomScenario = {
  size: number;
  hashes: number;
  insertions: string[];
  queries: string[];
};

export type GreedyScenario = {
  problem: "knapsack" | "activity-selection" | "huffman";
  items: { id: string; weight: number; value: number; start?: number; end?: number }[];
  capacity?: number;
};

export type DPScenario = {
  problem: "knapsack" | "lcs" | "edit-distance";
  stringA?: string;
  stringB?: string;
  items?: { weight: number; value: number }[];
  capacity?: number;
};

export type Scenario =
  | GraphScenario
  | ArrayScenario
  | MemoryScenario
  | SequenceScenario
  | CallStackScenario
  | LinkedScenario
  | LinearAdtScenario
  | ComplexityScenario
  | TreeScenario
  | TrieScenario
  | BitwiseScenario
  | RecurrenceScenario
  | BacktrackingScenario
  | BloomScenario
  | GreedyScenario
  | DPScenario;
```

### 3.2 `lib/schemas/skill.ts`
We update enums inside the Zod validation schemas for `templateId` and `engineId`:

```typescript
// lib/schemas/skill.ts

export const simulationDefinitionSchema = z.object({
  schemaVersion: z.literal(1),
  templateId: z.enum([
    "graph-v1",
    "sort-search-v1",
    "guided-lesson-v1",
    // New visualizer layouts
    "memory-v1",
    "sequence-v1",
    "call-stack-v1",
    "linked-v1",
    "linear-adt-v1",
    "complexity-v1",
    "tree-v1",
    "trie-v1",
    "bitwise-v1",
    "recurrence-v1",
    "decision-tree-v1",
    "probabilistic-v1",
    "greedy-v1",
    "dp-grid-v1"
  ]),
  engineId: z.enum([
    "dijkstra", "bfs", "dfs", "binary-search", "insertion-sort", "guided",
    // New engine IDs
    "pointers", "strings", "arrays", "structures", "dynamic-memory-allocation",
    "recursion", "linked-lists", "skip-lists", "stacks", "queues",
    "algorithm-analysis", "binary-trees", "binary-search-trees", "heaps", "tries",
    "bitwise-operators", "avl-trees", "b-trees", "red-black-trees", "treaps",
    "growth-of-functions", "big-o", "big-omega", "big-theta", "master-theorem",
    "divide-and-conquer", "backtracking", "bloom-filters", "greedy-algorithms",
    "dynamic-programming"
  ]),
  config: z.record(z.unknown()).default({}),
});
```

---

## 4. Custom Inputs & Controls Mapping (R2)

Below is the implementation spec mapping each family of skills to its custom controls, validation constraints, and default inputs:

| Family | Skills Included | User-Customizable Controls (UI Elements) | Input Validation Constraints | Default Configurations |
| :--- | :--- | :--- | :--- | :--- |
| **Memory** | `pointers`, `structures`, `dynamic-memory-allocation` | - Preset select dropdown<br>- Comma-separated variable definitions (`name:val`) text field<br>- Dynamic memory operation editor textarea | - Variable names: alphanumeric, max 3<br>- Operation syntax: `*p = X`, `p = &y`, `free(p)`, `malloc(X)` | Preset: **Pointer Aliasing**<br>`variables`: `a:10`, `b:20`<br>`statements`: `p=&a; q=&b; *p=30; q=p;` |
| **Sequence** | `strings`, `arrays` | - Character/number array input text field<br>- Index slider/selector<br>- Traverse vs. Write toggle | - String max length: 15<br>- Array numbers range: -99 to 999<br>- Array length: 3 to 12 | Preset: **Arrays**<br>`elements`: `[15, 30, 45, 60]`<br>Preset: **Strings**<br>`elements`: `['h','e','l','l','o','\0']` |
| **Call Stack** | `recursion` | - Algorithm selector (Factorial, Fibonacci, GCD)<br>- Numeric parameter input (`N`, `M`) | - $N$ range: $1 \le N \le 7$ (Fibonacci) or $1 \le N \le 12$ (Factorial) | Preset: **Fibonacci**<br>`N`: `4` |
| **Linked** | `linked-lists`, `skip-lists` | - Comma-separated initial values text field<br>- Insertion Value/Index numeric fields<br>- Deletion target selection dropdown<br>- Levels count input (for skip lists) | - Values count: 2 to 8 nodes<br>- Insertion index: $0 \le i \le \text{length}$<br>- Skip list levels: 2 to 4 | Preset: **Singly Linked**<br>`values`: `['A', 'B', 'C']`<br>`operation`: `insert('D', 1)` |
| **Linear ADT** | `stacks`, `queues` | - Operations queue text field (comma-separated commands, e.g. `push(A), pop(), push(B)`) | - Max operations: 8<br>- Character values: alphanumeric | Preset: **Stack ADT**<br>`operations`: `push(5), push(12), pop(), push(7)` |
| **Complexity** | `algorithm-analysis`, `growth-of-functions`, `big-o`, `big-omega`, `big-theta` | - Equation input for $f(n)$ and $g(n)$<br>- Constants $c$ and $n_0$ slider controls<br>- Input size $N$ boundary slider | - Coefficient range: 0.1 to 100<br>- Powers range: 0 to 3 (polynomial support)<br>- $n_0$ range: $1 \le n_0 \le 50$ | Preset: **Asymptotic upper bound**<br>`f_n`: `3n^2 + 5n`<br>`g_n`: `n^2`<br>`c`: `4`, `n0`: `5` |
| **Tree** | `binary-trees`, `binary-search-trees`, `heaps`, `avl-trees`, `b-trees`, `red-black-trees`, `treaps` | - Value insertion list input text field<br>- Deletion value selection dropdown<br>- Binary Tree structure text field (serialized level-order)<br>- Heap type select (Min vs Max)<br>- B-tree order selector (3, 4, 5)<br>- Traversal order selector (Pre, In, Post) | - Maximum node count: 15<br>- Numeric values range: -99 to 999<br>- String values max 2 chars<br>- Serialization format: `[root, left, right, ...]` | Preset: **BST Insertion**<br>`insertions`: `[15, 10, 20, 8, 12, 17, 25]`<br>Preset: **AVL LL-rotation**<br>`insertions`: `[30, 20, 10]` |
| **Trie** | `tries` | - Words list input text field (comma separated)<br>- Search prefix input text field | - Word length: 1 to 8 chars<br>- Words limit: 8 strings<br>- Characters: a-z lowercase only | Preset: **Trie Prefix Search**<br>`words`: `["cat", "car", "cap", "dog"]`<br>`searchPrefix`: `"ca"` |
| **Bitwise** | `bitwise-operators` | - Operand A & B binary bit toggles (8 cells)<br>- Operator selector (AND, OR, XOR, NOT, Shift L/R)<br>- Shift count numeric input | - Registers: 8-bit, 16-bit, or 32-bit<br>- Shift count: 0 to 7 | Preset: **Bit Masking**<br>`operandA`: `0b11001010`<br>`operandB`: `0b00001111`<br>`operator`: `AND` |
| **Recurrence** | `master-theorem`, `divide-and-conquer` | - $a$ (subproblems count) numeric slider<br>- $b$ (subproblems scale) numeric slider<br>- $f(n)$ runtime function selector<br>- $N$ problem size select | - $1 \le a \le 16$<br>- $2 \le b \le 8$<br>- $f(n) \in \{1, \log n, n, n \log n, n^2, n^3\}$ | Preset: **Master Theorem Case 1**<br>`a`: `4`, `b`: `2`<br>`fn`: `n` |
| **Backtracking** | `backtracking` | - Problem mode selection (N-Queens, Maze Path)<br>- Board size/dimension slider ($N \times N$)<br>- Maze wall placement editor grid | - $N$ grid dimensions: $4 \times 4$ to $8 \times 8$ | Preset: **N-Queens**<br>`size`: `4` |
| **Probabilistic**| `bloom-filters` | - Hash count $k$ numeric input<br>- Filter size $m$ numeric input<br>- Strings to insert and query inputs | - $1 \le k \le 4$<br>- $8 \le m \le 64$<br>- Strings: max 5 words | Preset: **Bloom Membership**<br>`m`: `16`, `k`: `3`<br>`insertions`: `["apple", "pear"]` |
| **Greedy** | `greedy-algorithms` | - Knapsack capacity input slider<br>- Activity scheduling list grid (start/end times)<br>- Huffman strings frequencies | - Knapsack capacity: 1 to 50<br>- Activity entries: 3 to 7 items<br>- Huffman characters: 3 to 6 | Preset: **Fractional Knapsack**<br>`capacity`: `20`<br>`items`: `[(w:10, v:60), (w:20, v:100)]` |
| **DP Grid** | `dynamic-programming` | - Row string $A$ text input<br>- Column string $B$ text input<br>- DP Problem selection (LCS, Edit Distance) | - String A/B length: 1 to 8 chars<br>- Characters: alphanumeric | Preset: **Longest Common Subsequence**<br>`stringA`: `"stone"`<br>`stringB`: `"longest"` |

---

## 5. Visualizer Components Design & Layout Logic

To render the simulations in LearnWorld's signature retro-modern style (bold `#13211b` borders, cream background, forest green status, lime accents), we propose 10 custom visualizer components to be built. Below are their visual UI sketches and rendering logics:

### 5.1 Memory Visualizer (`components/simulations/MemoryLab.tsx`)
- **Rendering Logic**: Renders a vertical representation of Stack Frames (name, parameters, locals, addresses) alongside a block-grid representation of Heap Allocations (address pointer connections, data blocks, ownership arrows).
- **UI Design Sketch**:
```
+-----------------------------------------------------------------------+
|  STACK FRAMES                            HEAP BLOCKS                  |
|  +------------------------------+        +-------------------------+  |
|  | main()                       |        | [0x7ffe] value: 10      |  |
|  |   int a = 10   (0x1000)      |------->| [0x8004] value: 20      |  |
|  |   int* p       (0x1004) =====|==+     +-------------------------+  |
|  +------------------------------+  |                                  |
|  | foo(int* q)                  |  +---->| POINTER LINK REFERENCE  |  |
|  |   q = 0x8004   (0x2000) --------+     | [q] (0x2000) -> [0x8004]|  |
|  +------------------------------+        +-------------------------+  |
|                                                                       |
|  STATUS: Step 2 of 4 (Variable a assigned; ptr p bound to a)          |
+-----------------------------------------------------------------------+
```

### 5.2 Tree Visualizer (`components/simulations/TreeLab.tsx`)
- **Rendering Logic**: Dynamically maps tree nodes using standard $x, y$ depth positions. If it is AVL/Red-Black, displays node heights, balance factors, color statuses (`red`/`black` states), or heap priority values (for Treaps).
- **UI Design Sketch**:
```
+-----------------------------------------------------------------------+
|                       ( [15] BF:0, Color: BLACK )                     |
|                               /         \                             |
|                              /           \                            |
|             ( [10] BF:-1, RED )         ( [20] BF:1, RED )            |
|                   /                                \                  |
|                  /                                  \                 |
|          ( [8] BF:0, BLACK )                ( [25] BF:0, BLACK )      |
|                                                                       |
|  STATUS: Settle AVL balance. LL Rotation applied on Node [10].        |
+-----------------------------------------------------------------------+
```

### 5.3 Complexity Plotter (`components/simulations/ComplexityLab.tsx`)
- **Rendering Logic**: Plots the performance functions $f(n)$ and $g(n)$ on an interactive Cartesian chart. Highlights the crossing point $n_0$ and the upper/lower bounds graphically using shaded regions where $c \cdot g(n) \ge f(n)$.
- **UI Design Sketch**:
```
+-----------------------------------------------------------------------+
|  y                                                                    |
|  |          / c*g(n) = 4n^2                                           |
|  |         /                                                          |
|  |        /   . f(n) = 3n^2 + 5n                                      |
|  |       /.  /                                                        |
|  |      / . /                                                         |
|  |     /   /                                                          |
|  |    /   /|                                                          |
|  |   /   / |  Shaded Area: c*g(n) >= f(n) holds                       |
|  +--+---+--+------------------------> n                               |
|        n0 = 5                                                         |
|  STATUS: Verified O(n^2) bound for N >= 5 with constant C = 4.        |
+-----------------------------------------------------------------------+
```

### 5.4 Call Stack & Recursion Visualizer (`components/simulations/CallStackLab.tsx`)
- **Rendering Logic**: Displays a visual recursion tree representing subproblems, alongside a stack diagram of active execution frames. Highlight active frame evaluation.
- **UI Design Sketch**:
```
+-----------------------------------------------------------------------+
|  RECURSION TREE                           CALL STACK                  |
|         fib(4)                            +------------------------+  |
|        /      \                           | fib(2)  [N=2, active]  |  |
|    fib(3)    fib(2)                       +------------------------+  |
|    /    \                                 | fib(3)  [N=3, waiting] |  |
| fib(2) fib(1)                             +------------------------+  |
|                                           | fib(4)  [N=4, waiting] |  |
|                                           +------------------------+  |
|  STATUS: Recurse into fib(2). Pushing new stack frame.                |
+-----------------------------------------------------------------------+
```

---

## 6. Code Integrations & Wiring

To bind the new engines, scenario configurations, and custom visualizers, we must modify the existing core files:

### 6.1 `lib/simulations/registry.ts`
We wire the initialization methods for each of the new concepts and define default scenarios:

```typescript
// lib/simulations/registry.ts

import { 
  dijkstraEngine, bfsEngine, dfsEngine, binarySearchEngine, insertionSortEngine,
  pointersEngine, stringsEngine, arraysEngine, structuresEngine, dynamicMemoryEngine,
  recursionEngine, linkedListEngine, skipListEngine, stacksEngine, queuesEngine,
  algAnalysisEngine, growthOfFunctionsEngine, bigOEngine, bigOmegaEngine, bigThetaEngine,
  binaryTreesEngine, bstEngine, heapsEngine, triesEngine, bitwiseEngine,
  avlEngine, btreeEngine, rbtEngine, treapsEngine, masterTheoremEngine,
  divideAndConquerEngine, backtrackingEngine, bloomFilterEngine, greedyEngine, dpEngine
} from "@/lib/engines";
import type { ConceptId, Scenario, SimulationRun, TemplateId } from "@/lib/types";

export type SimulationInputs = {
  graph?: any;
  array?: any;
  memory?: any;
  sequence?: any;
  callStack?: any;
  linked?: any;
  linearAdt?: any;
  complexity?: any;
  tree?: any;
  trie?: any;
  bitwise?: any;
  recurrence?: any;
  backtracking?: any;
  bloom?: any;
  greedy?: any;
  dp?: any;
};

export type EngineRegistration = {
  template: TemplateId;
  initialize(inputs: SimulationInputs): SimulationRun<any>;
};

export const engineRegistry: Record<ConceptId, EngineRegistration> = {
  dijkstra: { template: "graph", initialize: (inps) => dijkstraEngine.initialize(inps.graph) },
  bfs: { template: "graph", initialize: (inps) => bfsEngine.initialize(inps.graph) },
  dfs: { template: "graph", initialize: (inps) => dfsEngine.initialize(inps.graph) },
  binary_search: { template: "array", initialize: (inps) => binarySearchEngine.initialize(inps.array) },
  insertion_sort: { template: "array", initialize: (inps) => insertionSortEngine.initialize(inps.array) },
  
  // 30 New Concept Registrations
  pointers: { template: "memory", initialize: (inps) => pointersEngine.initialize(inps.memory) },
  strings: { template: "sequence", initialize: (inps) => stringsEngine.initialize(inps.sequence) },
  arrays: { template: "sequence", initialize: (inps) => arraysEngine.initialize(inps.sequence) },
  structures: { template: "memory", initialize: (inps) => structuresEngine.initialize(inps.memory) },
  dynamic_memory_allocation: { template: "memory", initialize: (inps) => dynamicMemoryEngine.initialize(inps.memory) },
  recursion: { template: "call-stack", initialize: (inps) => recursionEngine.initialize(inps.callStack) },
  linked_lists: { template: "linked", initialize: (inps) => linkedListEngine.initialize(inps.linked) },
  skip_lists: { template: "linked", initialize: (inps) => skipListEngine.initialize(inps.linked) },
  stacks: { template: "linear-adt", initialize: (inps) => stacksEngine.initialize(inps.linearAdt) },
  queues: { template: "linear-adt", initialize: (inps) => queuesEngine.initialize(inps.linearAdt) },
  algorithm_analysis: { template: "complexity", initialize: (inps) => algAnalysisEngine.initialize(inps.complexity) },
  growth_of_functions: { template: "complexity", initialize: (inps) => growthOfFunctionsEngine.initialize(inps.complexity) },
  big_o: { template: "complexity", initialize: (inps) => bigOEngine.initialize(inps.complexity) },
  big_omega: { template: "complexity", initialize: (inps) => bigOmegaEngine.initialize(inps.complexity) },
  big_theta: { template: "complexity", initialize: (inps) => bigThetaEngine.initialize(inps.complexity) },
  binary_trees: { template: "tree", initialize: (inps) => binaryTreesEngine.initialize(inps.tree) },
  binary_search_trees: { template: "tree", initialize: (inps) => bstEngine.initialize(inps.tree) },
  heaps: { template: "tree", initialize: (inps) => heapsEngine.initialize(inps.tree) },
  tries: { template: "trie", initialize: (inps) => triesEngine.initialize(inps.trie) },
  bitwise_operators: { template: "bitwise", initialize: (inps) => bitwiseEngine.initialize(inps.bitwise) },
  avl_trees: { template: "tree", initialize: (inps) => avlEngine.initialize(inps.tree) },
  b_trees: { template: "tree", initialize: (inps) => btreeEngine.initialize(inps.tree) },
  red_black_trees: { template: "tree", initialize: (inps) => rbtEngine.initialize(inps.tree) },
  treaps: { template: "tree", initialize: (inps) => treapsEngine.initialize(inps.tree) },
  master_theorem: { template: "recurrence", initialize: (inps) => masterTheoremEngine.initialize(inps.recurrence) },
  divide_and_conquer: { template: "recurrence", initialize: (inps) => divideAndConquerEngine.initialize(inps.recurrence) },
  backtracking: { template: "decision-tree", initialize: (inps) => backtrackingEngine.initialize(inps.backtracking) },
  bloom_filters: { template: "probabilistic", initialize: (inps) => bloomFilterEngine.initialize(inps.bloom) },
  greedy_algorithms: { template: "greedy", initialize: (inps) => greedyEngine.initialize(inps.greedy) },
  dynamic_programming: { template: "dp-grid", initialize: (inps) => dpEngine.initialize(inps.dp) },
};

export function defaultInputs(concept: ConceptId): SimulationInputs {
  return {
    graph: { /* graphScenario default */ },
    array: { /* arrayScenarios default */ },
    memory: { variables: [{ name: "a", type: "int", value: "10", address: "0x1000" }], heapAllocations: [], statements: ["p = &a"] },
    sequence: { elements: [1, 2, 3, 4, 5], operationType: "traverse" },
    callStack: { functionName: "factorial", initialArg: 5 },
    linked: { values: ["A", "B", "C"], operation: "search", operand: "B" },
    linearAdt: { values: [], operations: [{ type: "push", value: "A" }] },
    complexity: { f_n: "2n + 5", g_n: "n", c: 3, n0: 5 },
    tree: { nodes: [10, 5, 15, null, null, null, null], treeType: "binary" },
    trie: { words: ["app", "apple"], searchPrefix: "ap" },
    bitwise: { operandA: 12, operandB: 9, operator: "AND", bits: 8 },
    recurrence: { a: 2, b: 2, fn: "n", n: 8 },
    backtracking: { problem: "n-queens", size: 4 },
    bloom: { size: 16, hashes: 2, insertions: ["test"], queries: ["test"] },
    greedy: { problem: "knapsack", items: [{ id: "A", weight: 5, value: 10 }], capacity: 10 },
    dp: { problem: "lcs", stringA: "abc", stringB: "ac" }
  };
}
```

### 6.2 `components/SimulationShell.tsx`
We modify the simulation visualizer block inside `components/SimulationShell.tsx` to dynamically render the appropriate visualizer component based on the registration template:

```tsx
// components/SimulationShell.tsx (Render Block Modification)

import { MemoryLab } from "./simulations/MemoryLab";
import { TreeLab } from "./simulations/TreeLab";
import { CallStackLab } from "./simulations/CallStackLab";
import { ComplexityLab } from "./simulations/ComplexityLab";
import { LinearAdtLab } from "./simulations/LinearAdtLab";
import { BitwiseLab } from "./simulations/BitwiseLab";
import { TrieLab } from "./simulations/TrieLab";
import { RecurrenceLab } from "./simulations/RecurrenceLab";
import { BloomLab } from "./simulations/BloomLab";
import { GreedyLab } from "./simulations/GreedyLab";
import { DpLab } from "./simulations/DpLab";
import { BacktrackingLab } from "./simulations/BacktrackingLab";

// In SimulationShell Component render:
<section className="panel p-4 md:p-5">
  {meta.template === "graph" && graphSnapshot && (
    <GraphLab scenario={graph} snapshot={graphSnapshot} weighted={concept === "dijkstra"} />
  )}
  {meta.template === "array" && arraySnapshot && (
    <ArrayLab snapshot={arraySnapshot} concept={concept as "binary_search" | "insertion_sort"} />
  )}
  {meta.template === "memory" && (
    <MemoryLab scenario={memory} snapshot={snapshot as MemorySnapshot} />
  )}
  {meta.template === "tree" && (
    <TreeLab scenario={tree} snapshot={snapshot as TreeSnapshot} />
  )}
  {meta.template === "call-stack" && (
    <CallStackLab scenario={callStack} snapshot={snapshot as CallStackSnapshot} />
  )}
  {meta.template === "complexity" && (
    <ComplexityLab scenario={complexity} snapshot={snapshot as ComplexitySnapshot} />
  )}
  {meta.template === "linear-adt" && (
    <LinearAdtLab scenario={linearAdt} snapshot={snapshot as LinearAdtSnapshot} />
  )}
  {meta.template === "bitwise" && (
    <BitwiseLab scenario={bitwise} snapshot={snapshot as BitwiseSnapshot} />
  )}
  {meta.template === "trie" && (
    <TrieLab scenario={trie} snapshot={snapshot as TrieSnapshot} />
  )}
  {meta.template === "recurrence" && (
    <RecurrenceLab scenario={recurrence} snapshot={snapshot as RecurrenceSnapshot} />
  )}
  {meta.template === "probabilistic" && (
    <BloomLab scenario={bloom} snapshot={snapshot as BloomSnapshot} />
  )}
  {meta.template === "greedy" && (
    <GreedyLab scenario={greedy} snapshot={snapshot as GreedySnapshot} />
  )}
  {meta.template === "dp-grid" && (
    <DpLab scenario={dp} snapshot={snapshot as DpSnapshot} />
  )}
  {meta.template === "decision-tree" && (
    <BacktrackingLab scenario={backtracking} snapshot={snapshot as BacktrackingSnapshot} />
  )}
  
  {/* Controls and Autoplay block */}
</section>
```

We will also update the user input panel inside `SimulationShell` to render customized form controls based on the selected `ConceptId` or `TemplateId` to fulfill **R2**.

### 6.3 `components/Home.tsx`
We update the routing in `Home.tsx` to map all 32 concept IDs to the interactive `SimulationShell` instead of delegating to `GuidedSkill`:

```typescript
// components/Home.tsx

const interactiveConcept: Record<string, ConceptId> = {
  // Mapping Skill ID (catalog kebab-case) to Concept ID (types snake_case)
  "sorting": "insertion_sort",
  "graph-algorithms": "dijkstra",
  "pointers": "pointers",
  "strings": "strings",
  "arrays": "arrays",
  "structures": "structures",
  "dynamic-memory-allocation": "dynamic_memory_allocation",
  "recursion": "recursion",
  "linked-lists": "linked_lists",
  "stacks": "stacks",
  "queues": "queues",
  "algorithm-analysis": "algorithm_analysis",
  "binary-trees": "binary_trees",
  "binary-search-trees": "binary_search_trees",
  "heaps": "heaps",
  "tries": "tries",
  "bitwise-operators": "bitwise_operators",
  "avl-trees": "avl_trees",
  "growth-of-functions": "growth_of_functions",
  "big-o": "big_o",
  "big-omega": "big_omega",
  "big-theta": "big_theta",
  "master-theorem": "master_theorem",
  "divide-and-conquer": "divide_and_conquer",
  "backtracking": "backtracking",
  "b-trees": "b_trees",
  "red-black-trees": "red_black_trees",
  "treaps": "treaps",
  "skip-lists": "skip_lists",
  "bloom-filters": "bloom_filters",
  "greedy-algorithms": "greedy_algorithms",
  "dynamic-programming": "dynamic_programming"
};
```
By mapping all skill IDs to their respective `ConceptId` in `interactiveConcept`, `Home.tsx` will automatically instantiate `SimulationShell` for all 32 skills instead of showing the static `GuidedSkill` wrapper.

---

## 7. Verification & Testing Strategy

### 7.1 Automated Quality Verification
To ensure high code quality and compliance with curriculum schemas, we implement the following pipeline:
1. **Schema Check**:
   ```powershell
   npm run curriculum:validate
   ```
   This ensures the revised `catalog.json` adheres to the updated zod schema rules in `lib/schemas/skill.ts`.
2. **Vitest Unit Tests**:
   Create a dedicated unit test suite for the 30 new engines in `tests/engines/`:
   - `tests/engines/memoryEngine.test.ts`
   - `tests/engines/treeEngine.test.ts`
   - ...
   Each test will assert that given custom user input, the engine initializes correct states and event logs.
   Run tests using:
   ```powershell
   npm run test
   ```
3. **Linter Validation**:
   ```powershell
   npm run lint
   ```
   Ensures there are no TypeScript compile or import boundary errors.
4. **Next.js Production Compilation**:
   ```powershell
   npm run build
   ```
   Validates complete code safety under strict compilation checks.
