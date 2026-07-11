import { engine } from "../../engines";
import type { TreeScenario, SimulationEvent } from "../../types";

// ─── Exported types ──────────────────────────────────────────────────────────

export type TreeNode = {
  id: string;
  value: string | number;
  leftId: string | null;
  rightId: string | null;
  color?: "red" | "black";
  priority?: number;
  height?: number;
  keys?: (string | number)[];
  childrenIds?: string[];
};

export type TreeSnapshot = {
  nodes: Record<string, TreeNode>;
  rootId: string | null;
  traversalOrder: (string | number)[];
  currentNodeId: string | null;
  comparingValue: string | number | null;
  complete: boolean;
};

// ─── Internal tree node used during simulation ──────────────────────────────

type INode = {
  id: string;
  value: number;
  left: INode | null;
  right: INode | null;
  height: number;
  color: "red" | "black";
  priority: number;
  parent: INode | null;
};

// ─── Helpers ────────────────────────────────────────────────────────────────

let _nextId = 0;
function resetIds() { _nextId = 0; }
function newId(): string { return `node_${_nextId++}`; }

function makeINode(value: number, id?: string): INode {
  return {
    id: id ?? newId(),
    value,
    left: null,
    right: null,
    height: 1,
    color: "red",
    priority: 0,
    parent: null,
  };
}

function toNum(v: string | number | null | undefined): number {
  if (v === null || v === undefined) return 0;
  return typeof v === "string" ? parseFloat(v) || 0 : v;
}

function deepCloneNodes(nodes: Record<string, TreeNode>): Record<string, TreeNode> {
  const result: Record<string, TreeNode> = {};
  for (const key of Object.keys(nodes)) {
    const n = nodes[key];
    result[key] = {
      ...n,
      keys: n.keys ? [...n.keys] : undefined,
      childrenIds: n.childrenIds ? [...n.childrenIds] : undefined,
    };
  }
  return result;
}

function iNodeToRecord(root: INode | null): Record<string, TreeNode> {
  const record: Record<string, TreeNode> = {};
  function walk(n: INode | null) {
    if (!n) return;
    record[n.id] = {
      id: n.id,
      value: n.value,
      leftId: n.left?.id ?? null,
      rightId: n.right?.id ?? null,
      height: n.height,
      color: n.color,
      priority: n.priority,
    };
    walk(n.left);
    walk(n.right);
  }
  walk(root);
  return record;
}

function snap(
  root: INode | null,
  extra?: Partial<TreeSnapshot>,
): TreeSnapshot {
  const base: TreeSnapshot = {
    nodes: iNodeToRecord(root),
    rootId: root?.id ?? null,
    traversalOrder: [],
    currentNodeId: null,
    comparingValue: null,
    complete: false,
  };
  if (extra) {
    Object.assign(base, extra);
    // Always deep-clone the nodes from extra or rebuild from root
    base.nodes = extra.nodes ? deepCloneNodes(extra.nodes) : iNodeToRecord(root);
  }
  return base;
}

function pushSnap(
  states: TreeSnapshot[],
  events: SimulationEvent[],
  root: INode | null,
  event: SimulationEvent,
  extra?: Partial<TreeSnapshot>,
) {
  states.push(snap(root, extra));
  events.push(event);
}

// ─── BST helpers (shared by binary trees, BST, AVL, RBT, Treaps) ───────────

function bstInsert(root: INode | null, value: number, id?: string): INode {
  const node = makeINode(value, id);
  if (!root) return node;
  let curr: INode = root;
  while (true) {
    if (value <= curr.value) {
      if (curr.left) { curr = curr.left; }
      else { curr.left = node; node.parent = curr; break; }
    } else {
      if (curr.right) { curr = curr.right; }
      else { curr.right = node; node.parent = curr; break; }
    }
  }
  return root;
}

function bstFind(root: INode | null, value: number): INode | null {
  let curr = root;
  while (curr) {
    if (value === curr.value) return curr;
    curr = value < curr.value ? curr.left : curr.right;
  }
  return null;
}

function inorderSuccessor(node: INode): INode | null {
  let curr = node.right;
  while (curr && curr.left) curr = curr.left;
  return curr;
}

function getHeight(n: INode | null): number { return n ? n.height : 0; }

function updateHeight(n: INode) { n.height = 1 + Math.max(getHeight(n.left), getHeight(n.right)); }

function balanceFactor(n: INode): number { return getHeight(n.left) - getHeight(n.right); }

// ─── Tree traversals ────────────────────────────────────────────────────────

function performTraversal(
  root: INode | null,
  order: "preorder" | "inorder" | "postorder",
  states: TreeSnapshot[],
  events: SimulationEvent[],
) {
  const traversed: (string | number)[] = [];

  function visit(n: INode | null) {
    if (!n) return;

    if (order === "preorder") {
      traversed.push(n.value);
      pushSnap(states, events, root, {
        kind: "visit", codeLine: 1,
        message: `Visit node ${n.value} (Pre-order: visit root before subtrees).`,
        focus: [n.id],
      }, { traversalOrder: [...traversed], currentNodeId: n.id });
    }

    visit(n.left);

    if (order === "inorder") {
      traversed.push(n.value);
      pushSnap(states, events, root, {
        kind: "visit", codeLine: 2,
        message: `Visit node ${n.value} (In-order: left subtree complete).`,
        focus: [n.id],
      }, { traversalOrder: [...traversed], currentNodeId: n.id });
    }

    visit(n.right);

    if (order === "postorder") {
      traversed.push(n.value);
      pushSnap(states, events, root, {
        kind: "visit", codeLine: 3,
        message: `Visit node ${n.value} (Post-order: both subtrees complete).`,
        focus: [n.id],
      }, { traversalOrder: [...traversed], currentNodeId: n.id });
    }
  }
  visit(root);
  return traversed;
}

function performSearch(
  root: INode | null,
  target: number,
  states: TreeSnapshot[],
  events: SimulationEvent[],
): boolean {
  let curr = root;
  while (curr) {
    pushSnap(states, events, root, {
      kind: "compare", codeLine: 1,
      message: `Compare target ${target} with node ${curr.value}.`,
      focus: [curr.id],
    }, { currentNodeId: curr.id, comparingValue: target });

    if (target === curr.value) {
      pushSnap(states, events, root, {
        kind: "complete", codeLine: 2,
        message: `Found target value ${target} at node ${curr.id}.`,
        focus: [curr.id],
      }, { currentNodeId: curr.id, traversalOrder: [target], complete: true });
      return true;
    }
    if (target < curr.value) {
      curr = curr.left;
    } else {
      curr = curr.right;
    }
  }
  pushSnap(states, events, root, {
    kind: "complete", codeLine: 3,
    message: `Target ${target} not found in the tree.`,
    focus: [],
  }, { currentNodeId: null, complete: true });
  return false;
}

// ─── Build tree from level-order array (for generic binary trees) ───────────

function buildTreeFromLevelOrder(arr: (string | number | null)[]): { root: INode | null; idCounter: number } {
  if (!arr.length || arr[0] === null || arr[0] === undefined) return { root: null, idCounter: 0 };
  const nodes: (INode | null)[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === null || arr[i] === undefined) {
      nodes.push(null);
    } else {
      nodes.push(makeINode(toNum(arr[i]), `node_${i}`));
    }
  }
  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    if (!n) continue;
    const li = 2 * i + 1;
    const ri = 2 * i + 2;
    if (li < nodes.length && nodes[li]) { n.left = nodes[li]; nodes[li]!.parent = n; }
    if (ri < nodes.length && nodes[ri]) { n.right = nodes[ri]; nodes[ri]!.parent = n; }
  }
  // update heights bottom-up
  for (let i = nodes.length - 1; i >= 0; i--) {
    if (nodes[i]) updateHeight(nodes[i]!);
  }
  _nextId = arr.length;
  return { root: nodes[0], idCounter: arr.length };
}

function buildBstFromArray(arr: (string | number | null)[]): INode | null {
  const values = arr.filter((v): v is string | number => v !== null && v !== undefined);
  if (!values.length) return null;
  let root: INode | null = null;
  for (const v of values) {
    root = bstInsert(root, toNum(v));
  }
  return root;
}

// ─── BST delete helper (returns new root) ───────────────────────────────────

function bstDelete(root: INode | null, value: number): INode | null {
  if (!root) return null;
  if (value < root.value) {
    root.left = bstDelete(root.left, value);
    if (root.left) root.left.parent = root;
  } else if (value > root.value) {
    root.right = bstDelete(root.right, value);
    if (root.right) root.right.parent = root;
  } else {
    // found
    if (!root.left && !root.right) return null;
    if (!root.left) { const r = root.right!; r.parent = root.parent; return r; }
    if (!root.right) { const l = root.left!; l.parent = root.parent; return l; }
    const succ = inorderSuccessor(root)!;
    root.value = succ.value;
    root.right = bstDelete(root.right, succ.value);
    if (root.right) root.right.parent = root;
  }
  updateHeight(root);
  return root;
}

// ═══════════════════════════════════════════════════════════════════════════
// 1. BINARY TREES ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export const binaryTreesEngine = engine<TreeScenario, TreeSnapshot>((input) => {
  resetIds();
  const nodesArr = input.nodes ?? [1, 2, 3, 4, 5];
  const operation = (input as TreeScenario & { operation?: string }).operation ?? "traverse";

  const { root } = buildTreeFromLevelOrder(nodesArr);
  const states: TreeSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const initial = snap(root);
  states.push(initial);

  if (operation === "traverse") {
    const order = input.traversalOrder ?? "inorder";
    const traversed = performTraversal(root, order, states, events);
    if (states.length > 1) {
      states[states.length - 1] = { ...states[states.length - 1], complete: true };
    } else {
      pushSnap(states, events, root, {
        kind: "complete", codeLine: 4,
        message: `Traversal complete: [${traversed.join(", ")}].`,
        focus: [],
      }, { traversalOrder: traversed, complete: true });
    }
  } else if (operation === "search") {
    const target = toNum(input.searchTarget);
    performSearch(root, target, states, events);
  } else if (operation === "insert") {
    const target = toNum(input.searchTarget ?? input.insertions?.[0]);
    // BST insert into the tree
    let curr = root;
    const insertNode = makeINode(target);
    if (!curr) {
      pushSnap(states, events, insertNode, {
        kind: "place", codeLine: 1,
        message: `Tree is empty. Insert ${target} as the root.`,
        focus: [insertNode.id],
      }, { currentNodeId: insertNode.id, complete: true });
    } else {
      // walk the tree BST-style showing comparisons
      let placed = false;
      while (curr && !placed) {
        pushSnap(states, events, root, {
          kind: "compare", codeLine: 1,
          message: `Compare ${target} with node ${curr.value}.`,
          focus: [curr.id],
        }, { currentNodeId: curr.id, comparingValue: target });

        if (target <= curr.value) {
          if (curr.left) { curr = curr.left; }
          else {
            curr.left = insertNode; insertNode.parent = curr;
            placed = true;
          }
        } else {
          if (curr.right) { curr = curr.right; }
          else {
            curr.right = insertNode; insertNode.parent = curr;
            placed = true;
          }
        }
      }
      pushSnap(states, events, root, {
        kind: "place", codeLine: 2,
        message: `Insert ${target} as ${insertNode.parent ? (insertNode.parent.left === insertNode ? "left" : "right") + " child of " + insertNode.parent.value : "root"}.`,
        focus: [insertNode.id],
      }, { currentNodeId: insertNode.id, complete: true });
    }
  } else if (operation === "delete") {
    const target = toNum(input.searchTarget ?? input.deletions?.[0]);
    // Find the node first
    let curr = root;
    while (curr) {
      pushSnap(states, events, root, {
        kind: "compare", codeLine: 1,
        message: `Compare target ${target} with node ${curr.value}.`,
        focus: [curr.id],
      }, { currentNodeId: curr.id, comparingValue: target });
      if (target === curr.value) break;
      curr = target < curr.value ? curr.left : curr.right;
    }
    if (!curr) {
      pushSnap(states, events, root, {
        kind: "complete", codeLine: 2,
        message: `Value ${target} not found in the tree. Nothing to delete.`,
        focus: [],
      }, { complete: true });
    } else {
      const hasLeft = !!curr.left;
      const hasRight = !!curr.right;
      let msg: string;
      if (!hasLeft && !hasRight) msg = `Node ${target} is a leaf — remove it directly.`;
      else if (hasLeft && hasRight) {
        const succ = inorderSuccessor(curr)!;
        msg = `Node ${target} has two children. Replace with inorder successor ${succ.value}, then delete successor.`;
      } else {
        const child = (curr.left ?? curr.right)!;
        msg = `Node ${target} has one child (${child.value}). Replace node with its child.`;
      }
      const newRoot = bstDelete(root, target);
      pushSnap(states, events, newRoot, {
        kind: "place", codeLine: 3,
        message: msg,
        focus: [],
      }, { complete: true });
    }
  }

  return { initial: states[0], states, events };
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. BST ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export const bstEngine = engine<TreeScenario, TreeSnapshot>((input) => {
  resetIds();
  const nodesArr = input.nodes ?? [10, 5, 15, 2, 7, 12, 20];
  const operation = (input as TreeScenario & { operation?: string }).operation ?? "search";
  const traversalOrder = input.traversalOrder ?? "inorder";

  let root = buildBstFromArray(nodesArr);
  const states: TreeSnapshot[] = [];
  const events: SimulationEvent[] = [];

  states.push(snap(root));

  if (operation === "search") {
    const target = toNum(input.searchTarget ?? 12);
    performSearch(root, target, states, events);
  } else if (operation === "traverse") {
    const traversed = performTraversal(root, traversalOrder, states, events);
    if (states.length > 1) {
      states[states.length - 1] = { ...states[states.length - 1], complete: true };
    } else {
      pushSnap(states, events, root, {
        kind: "complete", codeLine: 4,
        message: `Traversal complete: [${traversed.join(", ")}].`,
        focus: [],
      }, { traversalOrder: traversed, complete: true });
    }
  } else if (operation === "insert") {
    const target = toNum(input.searchTarget ?? input.insertions?.[0]);
    const insertNode = makeINode(target);
    if (!root) {
      root = insertNode;
      pushSnap(states, events, root, {
        kind: "place", codeLine: 1,
        message: `Tree is empty. Insert ${target} as the root.`,
        focus: [insertNode.id],
      }, { currentNodeId: insertNode.id, complete: true });
    } else {
      let curr: INode = root;
      let placed = false;
      while (!placed) {
        pushSnap(states, events, root, {
          kind: "compare", codeLine: 1,
          message: `Compare ${target} with node ${curr.value}. Go ${target <= curr.value ? "left" : "right"}.`,
          focus: [curr.id],
        }, { currentNodeId: curr.id, comparingValue: target });

        if (target <= curr.value) {
          if (curr.left) { curr = curr.left; }
          else { curr.left = insertNode; insertNode.parent = curr; placed = true; }
        } else {
          if (curr.right) { curr = curr.right; }
          else { curr.right = insertNode; insertNode.parent = curr; placed = true; }
        }
      }
      pushSnap(states, events, root, {
        kind: "place", codeLine: 2,
        message: `Inserted ${target} as ${insertNode.parent!.left === insertNode ? "left" : "right"} child of ${insertNode.parent!.value}.`,
        focus: [insertNode.id],
      }, { currentNodeId: insertNode.id, complete: true });
    }
  } else if (operation === "delete") {
    const target = toNum(input.searchTarget ?? input.deletions?.[0]);
    // Step through to find node
    let curr = root;
    while (curr) {
      pushSnap(states, events, root, {
        kind: "compare", codeLine: 1,
        message: `Searching for ${target}: compare with node ${curr.value}.`,
        focus: [curr.id],
      }, { currentNodeId: curr.id, comparingValue: target });
      if (target === curr.value) break;
      curr = target < curr.value ? curr.left : curr.right;
    }
    if (!curr) {
      pushSnap(states, events, root, {
        kind: "complete", codeLine: 2,
        message: `Value ${target} not found in BST. Nothing to delete.`,
        focus: [],
      }, { complete: true });
    } else {
      const hasL = !!curr.left, hasR = !!curr.right;
      let msg: string;
      if (!hasL && !hasR) {
        msg = `Node ${target} is a leaf — remove it directly.`;
      } else if (hasL && hasR) {
        const succ = inorderSuccessor(curr)!;
        msg = `Node ${target} has two children. Replace with inorder successor ${succ.value}, then remove successor.`;
      } else {
        const child = (curr.left ?? curr.right)!;
        msg = `Node ${target} has one child (${child.value}). Bypass node with its child.`;
      }
      root = bstDelete(root, target);
      pushSnap(states, events, root, {
        kind: "place", codeLine: 3,
        message: msg,
        focus: [],
      }, {});
      pushSnap(states, events, root, {
        kind: "complete", codeLine: 4,
        message: `Deletion of ${target} complete.`,
        focus: [],
      }, { complete: true });
    }
  }

  return { initial: states[0], states, events };
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. HEAPS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export const heapsEngine = engine<TreeScenario, TreeSnapshot>((input) => {
  resetIds();
  const operation = (input as TreeScenario & { operation?: string }).operation ?? "insert";
  const heapArr = (input.nodes ?? [10, 20, 30, 40, 50]).filter((v): v is number => v !== null && v !== undefined).map(toNum);

  const states: TreeSnapshot[] = [];
  const events: SimulationEvent[] = [];

  // Helper: rebuild level-order snapshot from array
  const heapToSnapshot = (arr: number[], currentIdx?: number, comparingVal?: number): TreeSnapshot => {
    const nodes: Record<string, TreeNode> = {};
    for (let i = 0; i < arr.length; i++) {
      const li = 2 * i + 1;
      const ri = 2 * i + 2;
      nodes[`node_${i}`] = {
        id: `node_${i}`,
        value: arr[i],
        leftId: li < arr.length ? `node_${li}` : null,
        rightId: ri < arr.length ? `node_${ri}` : null,
      };
    }
    return {
      nodes: deepCloneNodes(nodes),
      rootId: arr.length > 0 ? "node_0" : null,
      traversalOrder: [],
      currentNodeId: currentIdx !== undefined ? `node_${currentIdx}` : null,
      comparingValue: comparingVal ?? null,
      complete: false,
    };
  };

  const currentHeap = [...heapArr];
  // Inputs describe heap contents, not necessarily a valid level-order heap.
  // Normalize once so both insert and extract-min always begin with the invariant.
  for (let start = Math.floor(currentHeap.length / 2) - 1; start >= 0; start--) {
    let index = start;
    while (true) {
      const left = 2 * index + 1;
      const right = left + 1;
      let smallest = index;
      if (left < currentHeap.length && currentHeap[left] < currentHeap[smallest]) smallest = left;
      if (right < currentHeap.length && currentHeap[right] < currentHeap[smallest]) smallest = right;
      if (smallest === index) break;
      [currentHeap[index], currentHeap[smallest]] = [currentHeap[smallest], currentHeap[index]];
      index = smallest;
    }
  }

  // Initial state
  states.push(heapToSnapshot(currentHeap));

  if (operation === "insert") {
    const newVal = toNum(input.searchTarget ?? input.insertions?.[0] ?? 5);

    // Add at end
    currentHeap.push(newVal);
    let currIdx = currentHeap.length - 1;
    states.push(heapToSnapshot(currentHeap, currIdx));
    events.push({
      kind: "enqueue", codeLine: 1,
      message: `Insert value ${newVal} at the end of the heap (index ${currIdx}).`,
      focus: [`node_${currIdx}`],
    });

    // Sift up
    while (currIdx > 0) {
      const parentIdx = Math.floor((currIdx - 1) / 2);
      const parentVal = currentHeap[parentIdx];
      const childVal = currentHeap[currIdx];

      states.push(heapToSnapshot(currentHeap, currIdx, parentVal));
      events.push({
        kind: "compare", codeLine: 2,
        message: `Compare child ${childVal} (index ${currIdx}) with parent ${parentVal} (index ${parentIdx}).`,
        focus: [`node_${currIdx}`, `node_${parentIdx}`],
      });

      if (childVal < parentVal) {
        currentHeap[currIdx] = parentVal;
        currentHeap[parentIdx] = childVal;
        states.push(heapToSnapshot(currentHeap, parentIdx));
        events.push({
          kind: "shift", codeLine: 3,
          message: `Sift up: swap ${childVal} and ${parentVal}.`,
          focus: [`node_${currIdx}`, `node_${parentIdx}`],
        });
        currIdx = parentIdx;
      } else {
        break;
      }
    }

    states.push({ ...heapToSnapshot(currentHeap), complete: true });
    events.push({
      kind: "complete", codeLine: 4,
      message: `Heap insert complete. Heap: [${currentHeap.join(", ")}].`,
      focus: [],
    });
  } else if (operation === "delete" || operation === "extract-min") {
    // Extract root (min)
    if (currentHeap.length === 0) {
      states.push({ ...heapToSnapshot(currentHeap), complete: true });
      events.push({ kind: "complete", codeLine: 1, message: "Heap is empty. Nothing to extract.", focus: [] });
    } else {
      const extracted = currentHeap[0];
      states.push(heapToSnapshot(currentHeap, 0));
      events.push({
        kind: "visit", codeLine: 1,
        message: `Extract root value ${extracted} (the minimum).`,
        focus: ["node_0"],
      });

      // Move last to root
      const lastVal = currentHeap.pop()!;
      if (currentHeap.length > 0) {
        currentHeap[0] = lastVal;
        states.push(heapToSnapshot(currentHeap, 0));
        events.push({
          kind: "shift", codeLine: 2,
          message: `Move last element ${lastVal} to the root position.`,
          focus: ["node_0"],
        });

        // Sift down
        let currIdx = 0;
        while (true) {
          const li = 2 * currIdx + 1;
          const ri = 2 * currIdx + 2;
          let smallest = currIdx;
          if (li < currentHeap.length && currentHeap[li] < currentHeap[smallest]) smallest = li;
          if (ri < currentHeap.length && currentHeap[ri] < currentHeap[smallest]) smallest = ri;

          if (smallest === currIdx) break;

          states.push(heapToSnapshot(currentHeap, currIdx, currentHeap[smallest]));
          events.push({
            kind: "compare", codeLine: 3,
            message: `Compare node ${currentHeap[currIdx]} with smaller child ${currentHeap[smallest]}.`,
            focus: [`node_${currIdx}`, `node_${smallest}`],
          });

          const tmp = currentHeap[currIdx];
          currentHeap[currIdx] = currentHeap[smallest];
          currentHeap[smallest] = tmp;

          states.push(heapToSnapshot(currentHeap, smallest));
          events.push({
            kind: "shift", codeLine: 4,
            message: `Sift down: swap ${currentHeap[smallest]} and ${currentHeap[currIdx]}.`,
            focus: [`node_${currIdx}`, `node_${smallest}`],
          });

          currIdx = smallest;
        }
      }

      states.push({ ...heapToSnapshot(currentHeap), complete: true });
      events.push({
        kind: "complete", codeLine: 5,
        message: `Extracted ${extracted}. Heap: [${currentHeap.join(", ")}].`,
        focus: [],
      });
    }
  }

  return { initial: states[0], states, events };
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. AVL ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export const avlEngine = engine<TreeScenario, TreeSnapshot>((input) => {
  resetIds();
  const nodesArr = input.nodes ?? [10, 20, 30];
  const operation = (input as TreeScenario & { operation?: string }).operation ?? "insert";
  const traversalOrder = input.traversalOrder ?? "inorder";

  const states: TreeSnapshot[] = [];
  const events: SimulationEvent[] = [];

  // Build initial AVL from sequential BST inserts with balancing
  let avlRoot: INode | null = null;

  // AVL rotation helpers
  function rightRotate(y: INode): INode {
    const x = y.left!;
    const T2 = x.right;
    x.right = y;
    y.left = T2;
    if (T2) T2.parent = y;
    x.parent = y.parent;
    y.parent = x;
    updateHeight(y);
    updateHeight(x);
    return x;
  }

  function leftRotate(x: INode): INode {
    const y = x.right!;
    const T2 = y.left;
    y.left = x;
    x.right = T2;
    if (T2) T2.parent = x;
    y.parent = x.parent;
    x.parent = y;
    updateHeight(x);
    updateHeight(y);
    return y;
  }

  function avlInsertRec(
    node: INode | null,
    value: number,
    tracked: boolean,
  ): INode {
    if (!node) {
      const n = makeINode(value);
      if (tracked) {
        pushSnap(states, events, avlRoot, {
          kind: "place", codeLine: 1,
          message: `Insert new node ${value}.`,
          focus: [n.id],
        }, { currentNodeId: n.id });
      }
      return n;
    }

    if (tracked) {
      pushSnap(states, events, avlRoot ?? node, {
        kind: "compare", codeLine: 2,
        message: `Compare ${value} with node ${node.value}.`,
        focus: [node.id],
      }, { currentNodeId: node.id, comparingValue: value });
    }

    if (value <= node.value) {
      node.left = avlInsertRec(node.left, value, tracked);
      node.left.parent = node;
    } else {
      node.right = avlInsertRec(node.right, value, tracked);
      node.right.parent = node;
    }

    updateHeight(node);
    const bf = balanceFactor(node);

    // Left-Left (LL)
    if (bf > 1 && value <= node.left!.value) {
      if (tracked) {
        pushSnap(states, events, avlRoot ?? node, {
          kind: "relax", codeLine: 3,
          message: `Node ${node.value} is left-heavy (BF=${bf}). Right rotation (LL case).`,
          focus: [node.id],
        }, { currentNodeId: node.id });
      }
      return rightRotate(node);
    }
    // Right-Right (RR)
    if (bf < -1 && value > node.right!.value) {
      if (tracked) {
        pushSnap(states, events, avlRoot ?? node, {
          kind: "relax", codeLine: 4,
          message: `Node ${node.value} is right-heavy (BF=${bf}). Left rotation (RR case).`,
          focus: [node.id],
        }, { currentNodeId: node.id });
      }
      return leftRotate(node);
    }
    // Left-Right (LR)
    if (bf > 1 && value > node.left!.value) {
      if (tracked) {
        pushSnap(states, events, avlRoot ?? node, {
          kind: "relax", codeLine: 5,
          message: `Node ${node.value} is left-heavy (BF=${bf}). LR case: left-rotate left child, then right-rotate.`,
          focus: [node.id, node.left!.id],
        }, { currentNodeId: node.id });
      }
      node.left = leftRotate(node.left!);
      node.left.parent = node;
      return rightRotate(node);
    }
    // Right-Left (RL)
    if (bf < -1 && value <= node.right!.value) {
      if (tracked) {
        pushSnap(states, events, avlRoot ?? node, {
          kind: "relax", codeLine: 6,
          message: `Node ${node.value} is right-heavy (BF=${bf}). RL case: right-rotate right child, then left-rotate.`,
          focus: [node.id, node.right!.id],
        }, { currentNodeId: node.id });
      }
      node.right = rightRotate(node.right!);
      node.right.parent = node;
      return leftRotate(node);
    }

    return node;
  }

  function avlDeleteRec(node: INode | null, value: number): INode | null {
    if (!node) return null;

    pushSnap(states, events, avlRoot, {
      kind: "compare", codeLine: 1,
      message: `Searching for ${value}: compare with node ${node.value}.`,
      focus: [node.id],
    }, { currentNodeId: node.id, comparingValue: value });

    if (value < node.value) {
      node.left = avlDeleteRec(node.left, value);
      if (node.left) node.left.parent = node;
    } else if (value > node.value) {
      node.right = avlDeleteRec(node.right, value);
      if (node.right) node.right.parent = node;
    } else {
      // Found the node
      if (!node.left || !node.right) {
        const child = node.left ?? node.right;
        pushSnap(states, events, avlRoot, {
          kind: "place", codeLine: 2,
          message: `Delete node ${value}${child ? `: replace with child ${child.value}` : " (leaf)"}.`,
          focus: child ? [child.id] : [],
        }, {});
        if (!child) return null;
        child.parent = node.parent;
        return child;
      }
      const succ = inorderSuccessor(node)!;
      pushSnap(states, events, avlRoot, {
        kind: "place", codeLine: 2,
        message: `Delete node ${value}: replace with inorder successor ${succ.value}.`,
        focus: [succ.id],
      }, {});
      node.value = succ.value;
      node.right = avlDeleteRec(node.right, succ.value);
      if (node.right) node.right.parent = node;
    }

    updateHeight(node);
    const bf = balanceFactor(node);

    if (bf > 1 && balanceFactor(node.left!) >= 0) {
      pushSnap(states, events, avlRoot, {
        kind: "relax", codeLine: 3,
        message: `Node ${node.value} is left-heavy (BF=${bf}). Right rotation (LL case).`,
        focus: [node.id],
      }, { currentNodeId: node.id });
      return rightRotate(node);
    }
    if (bf > 1 && balanceFactor(node.left!) < 0) {
      pushSnap(states, events, avlRoot, {
        kind: "relax", codeLine: 5,
        message: `Node ${node.value} is left-heavy (BF=${bf}). LR case: left-rotate left child, then right-rotate.`,
        focus: [node.id],
      }, { currentNodeId: node.id });
      node.left = leftRotate(node.left!);
      node.left.parent = node;
      return rightRotate(node);
    }
    if (bf < -1 && balanceFactor(node.right!) <= 0) {
      pushSnap(states, events, avlRoot, {
        kind: "relax", codeLine: 4,
        message: `Node ${node.value} is right-heavy (BF=${bf}). Left rotation (RR case).`,
        focus: [node.id],
      }, { currentNodeId: node.id });
      return leftRotate(node);
    }
    if (bf < -1 && balanceFactor(node.right!) > 0) {
      pushSnap(states, events, avlRoot, {
        kind: "relax", codeLine: 6,
        message: `Node ${node.value} is right-heavy (BF=${bf}). RL case: right-rotate right child, then left-rotate.`,
        focus: [node.id],
      }, { currentNodeId: node.id });
      node.right = rightRotate(node.right!);
      node.right.parent = node;
      return leftRotate(node);
    }

    return node;
  }

  // Build initial tree (silently)
  const buildValues = nodesArr.filter((v): v is string | number => v !== null && v !== undefined);
  for (const v of buildValues) {
    avlRoot = avlInsertRec(avlRoot, toNum(v), false);
  }

  states.push(snap(avlRoot));

  if (operation === "insert") {
    const target = toNum(input.searchTarget ?? input.insertions?.[0] ?? 25);
    avlRoot = avlInsertRec(avlRoot, target, true);
    pushSnap(states, events, avlRoot, {
      kind: "complete", codeLine: 7,
      message: `AVL insert of ${target} complete. Tree is balanced.`,
      focus: [],
    }, { complete: true });
  } else if (operation === "delete") {
    const target = toNum(input.searchTarget ?? input.deletions?.[0] ?? buildValues[0]);
    avlRoot = avlDeleteRec(avlRoot, target);
    pushSnap(states, events, avlRoot, {
      kind: "complete", codeLine: 7,
      message: `AVL delete of ${target} complete. Tree is balanced.`,
      focus: [],
    }, { complete: true });
  } else if (operation === "search") {
    const target = toNum(input.searchTarget);
    performSearch(avlRoot, target, states, events);
  } else if (operation === "traverse") {
    const traversed = performTraversal(avlRoot, traversalOrder, states, events);
    if (states.length > 1) {
      states[states.length - 1] = { ...states[states.length - 1], complete: true };
    } else {
      pushSnap(states, events, avlRoot, {
        kind: "complete", codeLine: 4,
        message: `Traversal complete: [${traversed.join(", ")}].`,
        focus: [],
      }, { traversalOrder: traversed, complete: true });
    }
  }

  return { initial: states[0], states, events };
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. B-TREE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

type BNode = {
  id: string;
  keys: number[];
  children: BNode[];
  leaf: boolean;
};

let _bNextId = 0;
function newBId(): string { return `bnode_${_bNextId++}`; }

function bNodeToRecord(root: BNode | null): Record<string, TreeNode> {
  const record: Record<string, TreeNode> = {};
  function walk(n: BNode | null) {
    if (!n) return;
    record[n.id] = {
      id: n.id,
      value: n.keys.join(","),
      leftId: null,
      rightId: null,
      keys: [...n.keys],
      childrenIds: n.children.map((c) => c.id),
    };
    for (const child of n.children) walk(child);
  }
  walk(root);
  return record;
}

function snapB(root: BNode | null, extra?: Partial<TreeSnapshot>): TreeSnapshot {
  const nodes = bNodeToRecord(root);
  return {
    nodes: deepCloneNodes(nodes),
    rootId: root?.id ?? null,
    traversalOrder: [],
    currentNodeId: null,
    comparingValue: null,
    complete: false,
    ...extra,
  };
}

export const legacyBtreeEngine = engine<TreeScenario, TreeSnapshot>((input) => {
  _bNextId = 0;
  const operation = (input as TreeScenario & { operation?: string }).operation ?? "insert";
  const order = input.btreeOrder ?? 3; // max keys = order - 1
  const maxKeys = order - 1;
  const nodesArr = (input.nodes ?? [10, 20, 5, 15]).filter((v): v is string | number => v !== null && v !== undefined);

  const states: TreeSnapshot[] = [];
  const events: SimulationEvent[] = [];

  let bRoot: BNode | null = null;

  // Split child of parent at index
  function splitChild(parent: BNode, idx: number) {
    const full = parent.children[idx];
    const midIdx = Math.floor(full.keys.length / 2);
    const midKey = full.keys[midIdx];
    const newNode: BNode = { id: newBId(), keys: full.keys.splice(midIdx + 1), children: [], leaf: full.leaf };
    full.keys.splice(midIdx); // remove mid from full
    if (!full.leaf) {
      newNode.children = full.children.splice(midIdx + 1);
    }
    parent.keys.splice(idx, 0, midKey);
    parent.children.splice(idx + 1, 0, newNode);
  }

  function insertNonFull(node: BNode, key: number, tracked: boolean) {
    let i = node.keys.length - 1;
    if (node.leaf) {
      // Insert key in sorted position
      while (i >= 0 && key < node.keys[i]) { i--; }
      node.keys.splice(i + 1, 0, key);
      if (tracked) {
        pushSnap2(states, events, bRoot, {
          kind: "place", codeLine: 2,
          message: `Insert key ${key} into leaf node [${node.keys.join(", ")}].`,
          focus: [node.id],
        }, { currentNodeId: node.id });
      }
    } else {
      while (i >= 0 && key < node.keys[i]) { i--; }
      i++;
      if (tracked) {
        pushSnap2(states, events, bRoot, {
          kind: "compare", codeLine: 3,
          message: `Navigate to child ${i} of node [${node.keys.join(", ")}].`,
          focus: [node.id],
        }, { currentNodeId: node.id, comparingValue: key });
      }
      if (node.children[i].keys.length >= maxKeys) {
        splitChild(node, i);
        if (tracked) {
          pushSnap2(states, events, bRoot, {
            kind: "relax", codeLine: 4,
            message: `Child was full. Split completed. Median key promoted to [${node.keys.join(", ")}].`,
            focus: [node.id],
          }, { currentNodeId: node.id });
        }
        if (key > node.keys[i]) i++;
      }
      insertNonFull(node.children[i], key, tracked);
    }
  }

  function pushSnap2(
    st: TreeSnapshot[], ev: SimulationEvent[],
    r: BNode | null, event: SimulationEvent,
    extra?: Partial<TreeSnapshot>,
  ) {
    st.push(snapB(r, extra));
    ev.push(event);
  }

  function btreeInsert(key: number, tracked: boolean) {
    if (!bRoot) {
      bRoot = { id: newBId(), keys: [key], children: [], leaf: true };
      if (tracked) {
        pushSnap2(states, events, bRoot, {
          kind: "place", codeLine: 1,
          message: `Create root node with key ${key}.`,
          focus: [bRoot.id],
        }, { currentNodeId: bRoot.id });
      }
      return;
    }
    if (bRoot.keys.length >= maxKeys) {
      const newRoot: BNode = { id: newBId(), keys: [], children: [bRoot], leaf: false };
      splitChild(newRoot, 0);
      bRoot = newRoot;
      if (tracked) {
        pushSnap2(states, events, bRoot, {
          kind: "relax", codeLine: 4,
          message: `Root was full. Split root; new root is [${bRoot.keys.join(", ")}].`,
          focus: [bRoot.id],
        }, { currentNodeId: bRoot.id });
      }
      insertNonFull(bRoot, key, tracked);
    } else {
      insertNonFull(bRoot, key, tracked);
    }
  }

  // Build initial tree silently
  for (const v of nodesArr) {
    btreeInsert(toNum(v), false);
  }

  states.push(snapB(bRoot));

  if (operation === "insert") {
    const target = toNum(input.searchTarget ?? input.insertions?.[0] ?? 25);
    btreeInsert(target, true);
    states.push({ ...snapB(bRoot), complete: true });
    events.push({
      kind: "complete", codeLine: 5,
      message: `B-tree insert of ${target} complete.`,
      focus: [],
    });
  } else if (operation === "search") {
    const target = toNum(input.searchTarget ?? 10);
    const btreeSearch = (node: BNode | null, key: number): boolean => {
      if (!node) {
        states.push({ ...snapB(bRoot), complete: true });
        events.push({ kind: "complete", codeLine: 3, message: `Key ${key} not found in B-tree.`, focus: [] });
        return false;
      }
      states.push(snapB(bRoot, { currentNodeId: node.id, comparingValue: key }));
      events.push({
        kind: "compare", codeLine: 1,
        message: `Search node [${node.keys.join(", ")}] for key ${key}.`,
        focus: [node.id],
      });
      let i = 0;
      while (i < node.keys.length && key > node.keys[i]) i++;
      if (i < node.keys.length && node.keys[i] === key) {
        states.push({ ...snapB(bRoot, { currentNodeId: node.id, traversalOrder: [key] }), complete: true });
        events.push({
          kind: "complete", codeLine: 2,
          message: `Found key ${key} in node [${node.keys.join(", ")}].`,
          focus: [node.id],
        });
        return true;
      }
      if (node.leaf) {
        states.push({ ...snapB(bRoot), complete: true });
        events.push({ kind: "complete", codeLine: 3, message: `Key ${key} not found (reached leaf).`, focus: [] });
        return false;
      }
      return btreeSearch(node.children[i], key);
    }
    btreeSearch(bRoot, target);
  }

  return { initial: states[0], states, events };
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. RED-BLACK TREE ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export const rbtEngine = engine<TreeScenario, TreeSnapshot>((input) => {
  resetIds();
  const nodesArr = input.nodes ?? [10, 5, 15];
  const operation = (input as TreeScenario & { operation?: string }).operation ?? "insert";
  const traversalOrder = input.traversalOrder ?? "inorder";

  const states: TreeSnapshot[] = [];
  const events: SimulationEvent[] = [];

  // RBT uses a sentinel NIL node
  const NIL: INode = makeINode(0, "NIL");
  NIL.color = "black";
  NIL.left = NIL;
  NIL.right = NIL;
  NIL.parent = NIL;

  let rbtRoot: INode = NIL;

  function isNil(n: INode): boolean { return n === NIL; }

  function rbtLeftRotate(x: INode) {
    const y = x.right!;
    x.right = y.left;
    if (!isNil(y.left!)) y.left!.parent = x;
    y.parent = x.parent;
    if (isNil(x.parent!)) rbtRoot = y;
    else if (x === x.parent!.left) x.parent!.left = y;
    else x.parent!.right = y;
    y.left = x;
    x.parent = y;
  }

  function rbtRightRotate(y: INode) {
    const x = y.left!;
    y.left = x.right;
    if (!isNil(x.right!)) x.right!.parent = y;
    x.parent = y.parent;
    if (isNil(y.parent!)) rbtRoot = x;
    else if (y === y.parent!.right) y.parent!.right = x;
    else y.parent!.left = x;
    x.right = y;
    y.parent = x;
  }

  function rbtToRecord(root: INode): Record<string, TreeNode> {
    const record: Record<string, TreeNode> = {};
    function walk(n: INode) {
      if (isNil(n)) return;
      record[n.id] = {
        id: n.id,
        value: n.value,
        leftId: isNil(n.left!) ? null : n.left!.id,
        rightId: isNil(n.right!) ? null : n.right!.id,
        color: n.color,
      };
      walk(n.left!);
      walk(n.right!);
    }
    walk(root);
    return record;
  }

  function rbtSnap(extra?: Partial<TreeSnapshot>): TreeSnapshot {
    const nodes = rbtToRecord(rbtRoot);
    return {
      nodes: deepCloneNodes(nodes),
      rootId: isNil(rbtRoot) ? null : rbtRoot.id,
      traversalOrder: [],
      currentNodeId: null,
      comparingValue: null,
      complete: false,
      ...extra,
    };
  }

  function rbtInsertFixup(z: INode, tracked: boolean) {
    while (z.parent!.color === "red") {
      if (z.parent === z.parent!.parent!.left) {
        const uncle = z.parent!.parent!.right!;
        if (uncle.color === "red") {
          // Case 1: uncle is red — recolor
          z.parent!.color = "black";
          uncle.color = "black";
          z.parent!.parent!.color = "red";
          if (tracked) {
            states.push(rbtSnap({ currentNodeId: z.id }));
            events.push({
              kind: "relax", codeLine: 2,
              message: `Uncle ${uncle.value} is red. Recolor parent ${z.parent!.value} and uncle to black, grandparent ${z.parent!.parent!.value} to red.`,
              focus: [z.parent!.id, uncle.id, z.parent!.parent!.id],
            });
          }
          z = z.parent!.parent!;
        } else {
          if (z === z.parent!.right) {
            // Case 2: uncle is black, z is right child — left rotate
            z = z.parent!;
            rbtLeftRotate(z);
            if (tracked) {
              states.push(rbtSnap({ currentNodeId: z.id }));
              events.push({
                kind: "relax", codeLine: 3,
                message: `Uncle is black, node is right child. Left rotate around ${z.value}.`,
                focus: [z.id],
              });
            }
          }
          // Case 3: uncle is black, z is left child — right rotate
          z.parent!.color = "black";
          z.parent!.parent!.color = "red";
          rbtRightRotate(z.parent!.parent!);
          if (tracked) {
            states.push(rbtSnap({ currentNodeId: z.id }));
            events.push({
              kind: "relax", codeLine: 4,
              message: `Recolor and right rotate around grandparent. Tree balanced.`,
              focus: [z.id],
            });
          }
        }
      } else {
        // Mirror cases (parent is right child of grandparent)
        const uncle = z.parent!.parent!.left!;
        if (uncle.color === "red") {
          z.parent!.color = "black";
          uncle.color = "black";
          z.parent!.parent!.color = "red";
          if (tracked) {
            states.push(rbtSnap({ currentNodeId: z.id }));
            events.push({
              kind: "relax", codeLine: 2,
              message: `Uncle ${uncle.value} is red. Recolor parent ${z.parent!.value} and uncle to black, grandparent ${z.parent!.parent!.value} to red.`,
              focus: [z.parent!.id, uncle.id, z.parent!.parent!.id],
            });
          }
          z = z.parent!.parent!;
        } else {
          if (z === z.parent!.left) {
            z = z.parent!;
            rbtRightRotate(z);
            if (tracked) {
              states.push(rbtSnap({ currentNodeId: z.id }));
              events.push({
                kind: "relax", codeLine: 3,
                message: `Uncle is black, node is left child. Right rotate around ${z.value}.`,
                focus: [z.id],
              });
            }
          }
          z.parent!.color = "black";
          z.parent!.parent!.color = "red";
          rbtLeftRotate(z.parent!.parent!);
          if (tracked) {
            states.push(rbtSnap({ currentNodeId: z.id }));
            events.push({
              kind: "relax", codeLine: 4,
              message: `Recolor and left rotate around grandparent. Tree balanced.`,
              focus: [z.id],
            });
          }
        }
      }
    }
    rbtRoot.color = "black";
  }

  function rbtInsert(value: number, tracked: boolean) {
    const z = makeINode(value);
    z.left = NIL;
    z.right = NIL;
    z.color = "red";

    let y: INode = NIL;
    let x: INode = rbtRoot;

    while (!isNil(x)) {
      y = x;
      if (tracked) {
        states.push(rbtSnap({ currentNodeId: x.id, comparingValue: value }));
        events.push({
          kind: "compare", codeLine: 1,
          message: `Compare ${value} with node ${x.value}. Go ${value <= x.value ? "left" : "right"}.`,
          focus: [x.id],
        });
      }
      x = value <= x.value ? x.left! : x.right!;
    }

    z.parent = y;
    if (isNil(y)) {
      rbtRoot = z;
    } else if (value <= y.value) {
      y.left = z;
    } else {
      y.right = z;
    }

    if (tracked) {
      states.push(rbtSnap({ currentNodeId: z.id }));
      events.push({
        kind: "place", codeLine: 1,
        message: `Insert red node ${value}${isNil(y) ? " as root" : ` as ${value <= y.value ? "left" : "right"} child of ${y.value}`}.`,
        focus: [z.id],
      });
    }

    rbtInsertFixup(z, tracked);
  }

  function rbtTransplant(from: INode, to: INode) {
    if (isNil(from.parent!)) rbtRoot = to;
    else if (from === from.parent!.left) from.parent!.left = to;
    else from.parent!.right = to;
    to.parent = from.parent;
  }

  function rbtMinimum(node: INode): INode {
    while (!isNil(node.left!)) node = node.left!;
    return node;
  }

  function rbtDeleteFixup(node: INode, tracked: boolean) {
    while (node !== rbtRoot && node.color === "black") {
      if (node === node.parent!.left) {
        let sibling = node.parent!.right!;
        if (sibling.color === "red") {
          sibling.color = "black";
          node.parent!.color = "red";
          rbtLeftRotate(node.parent!);
          if (tracked) { states.push(rbtSnap({ currentNodeId: node.parent!.id })); events.push({ kind: "relax", codeLine: 4, message: "Delete fix-up: recolor red sibling and rotate left.", focus: [node.parent!.id, sibling.id] }); }
          sibling = node.parent!.right!;
        }
        if (sibling.left!.color === "black" && sibling.right!.color === "black") {
          sibling.color = "red";
          node = node.parent!;
          if (tracked) { states.push(rbtSnap({ currentNodeId: node.id })); events.push({ kind: "relax", codeLine: 5, message: "Delete fix-up: sibling has black children, recolor and move up.", focus: [node.id, sibling.id] }); }
        } else {
          if (sibling.right!.color === "black") {
            sibling.left!.color = "black";
            sibling.color = "red";
            rbtRightRotate(sibling);
            sibling = node.parent!.right!;
          }
          sibling.color = node.parent!.color;
          node.parent!.color = "black";
          sibling.right!.color = "black";
          rbtLeftRotate(node.parent!);
          node = rbtRoot;
          if (tracked) { states.push(rbtSnap()); events.push({ kind: "relax", codeLine: 6, message: "Delete fix-up: rotate and restore black height.", focus: [sibling.id] }); }
        }
      } else {
        let sibling = node.parent!.left!;
        if (sibling.color === "red") {
          sibling.color = "black";
          node.parent!.color = "red";
          rbtRightRotate(node.parent!);
          if (tracked) { states.push(rbtSnap({ currentNodeId: node.parent!.id })); events.push({ kind: "relax", codeLine: 4, message: "Delete fix-up: recolor red sibling and rotate right.", focus: [node.parent!.id, sibling.id] }); }
          sibling = node.parent!.left!;
        }
        if (sibling.right!.color === "black" && sibling.left!.color === "black") {
          sibling.color = "red";
          node = node.parent!;
          if (tracked) { states.push(rbtSnap({ currentNodeId: node.id })); events.push({ kind: "relax", codeLine: 5, message: "Delete fix-up: sibling has black children, recolor and move up.", focus: [node.id, sibling.id] }); }
        } else {
          if (sibling.left!.color === "black") {
            sibling.right!.color = "black";
            sibling.color = "red";
            rbtLeftRotate(sibling);
            sibling = node.parent!.left!;
          }
          sibling.color = node.parent!.color;
          node.parent!.color = "black";
          sibling.left!.color = "black";
          rbtRightRotate(node.parent!);
          node = rbtRoot;
          if (tracked) { states.push(rbtSnap()); events.push({ kind: "relax", codeLine: 6, message: "Delete fix-up: rotate and restore black height.", focus: [sibling.id] }); }
        }
      }
    }
    node.color = "black";
  }

  function rbtDelete(node: INode, tracked: boolean) {
    let moved = node;
    let originalColor = moved.color;
    let fixupNode: INode;
    if (isNil(node.left!)) {
      fixupNode = node.right!;
      rbtTransplant(node, node.right!);
    } else if (isNil(node.right!)) {
      fixupNode = node.left!;
      rbtTransplant(node, node.left!);
    } else {
      moved = rbtMinimum(node.right!);
      originalColor = moved.color;
      fixupNode = moved.right!;
      if (moved.parent === node) fixupNode.parent = moved;
      else {
        rbtTransplant(moved, moved.right!);
        moved.right = node.right;
        moved.right!.parent = moved;
      }
      rbtTransplant(node, moved);
      moved.left = node.left;
      moved.left!.parent = moved;
      moved.color = node.color;
    }
    if (tracked) { states.push(rbtSnap()); events.push({ kind: "place", codeLine: 3, message: `Remove ${node.value} using the red-black transplant rule.`, focus: [] }); }
    if (originalColor === "black") rbtDeleteFixup(fixupNode, tracked);
  }

  // Build initial tree silently
  const buildValues = nodesArr.filter((v): v is string | number => v !== null && v !== undefined);
  for (const v of buildValues) {
    rbtInsert(toNum(v), false);
  }

  states.push(rbtSnap());

  if (operation === "insert") {
    const target = toNum(input.searchTarget ?? input.insertions?.[0] ?? 2);
    rbtInsert(target, true);
    rbtRoot.color = "black";
    states.push({ ...rbtSnap(), complete: true });
    events.push({
      kind: "complete", codeLine: 5,
      message: `Red-black tree insert of ${target} complete. All RBT invariants hold.`,
      focus: [],
    });
  } else if (operation === "search") {
    const target = toNum(input.searchTarget);
    // Search the RBT (same as BST search but using INode with NIL)
    let curr: INode = rbtRoot;
    let found = false;
    while (!isNil(curr)) {
      states.push(rbtSnap({ currentNodeId: curr.id, comparingValue: target }));
      events.push({
        kind: "compare", codeLine: 1,
        message: `Compare target ${target} with node ${curr.value}.`,
        focus: [curr.id],
      });
      if (target === curr.value) {
        states.push({ ...rbtSnap({ currentNodeId: curr.id, traversalOrder: [target] }), complete: true });
        events.push({
          kind: "complete", codeLine: 2,
          message: `Found ${target} in red-black tree.`,
          focus: [curr.id],
        });
        found = true;
        break;
      }
      curr = target < curr.value ? curr.left! : curr.right!;
    }
    if (!found) {
      states.push({ ...rbtSnap(), complete: true });
      events.push({ kind: "complete", codeLine: 3, message: `Target ${target} not found in red-black tree.`, focus: [] });
    }
  } else if (operation === "traverse") {
    // Convert RBT to INode tree without NIL sentinels for traversal
    const rbtToINode = (n: INode): INode | null => {
      if (isNil(n)) return null;
      const copy: INode = { ...n, left: null, right: null, parent: null };
      copy.left = rbtToINode(n.left!);
      copy.right = rbtToINode(n.right!);
      return copy;
    }
    const traversableRoot = rbtToINode(rbtRoot);
    const traversed = performTraversal(traversableRoot, traversalOrder, states, events);
    if (states.length > 1) {
      states[states.length - 1] = { ...states[states.length - 1], complete: true };
    } else {
      states.push({ ...rbtSnap({ traversalOrder: traversed }), complete: true });
      events.push({ kind: "complete", codeLine: 4, message: `Traversal complete: [${traversed.join(", ")}].`, focus: [] });
    }
  } else if (operation === "delete") {
    // Simplified RBT delete — do BST delete + recolor root
    const target = toNum(input.searchTarget ?? input.deletions?.[0]);
    // Find node
    let curr: INode = rbtRoot;
    let found = false;
    while (!isNil(curr)) {
      states.push(rbtSnap({ currentNodeId: curr.id, comparingValue: target }));
      events.push({
        kind: "compare", codeLine: 1,
        message: `Searching for ${target}: compare with node ${curr.value}.`,
        focus: [curr.id],
      });
      if (target === curr.value) { found = true; break; }
      curr = target < curr.value ? curr.left! : curr.right!;
    }
    if (!found) {
      states.push({ ...rbtSnap(), complete: true });
      events.push({ kind: "complete", codeLine: 2, message: `Value ${target} not found. Nothing to delete.`, focus: [] });
    } else {
      rbtDelete(curr, true);
      states.push({ ...rbtSnap(), complete: true });
      events.push({
        kind: "complete", codeLine: 4,
        message: `Red-black tree delete of ${target} complete.`,
        focus: [],
      });
    }
  }

  return { initial: states[0], states, events };
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. TREAPS ENGINE
// ═══════════════════════════════════════════════════════════════════════════

export const treapsEngine = engine<TreeScenario, TreeSnapshot>((input) => {
  resetIds();
  const nodesArr = input.nodes ?? [10, 20, 5];
  const operation = (input as TreeScenario & { operation?: string }).operation ?? "insert";
  const traversalOrder = input.traversalOrder ?? "inorder";

  const states: TreeSnapshot[] = [];
  const events: SimulationEvent[] = [];

  // Deterministic priority based on value
  function priority(value: number): number {
    return ((value * 2654435761) >>> 0) % 100;
  }

  let treapRoot: INode | null = null;

  function treapRightRotate(y: INode): INode {
    const x = y.left!;
    y.left = x.right;
    if (x.right) x.right.parent = y;
    x.right = y;
    x.parent = y.parent;
    y.parent = x;
    return x;
  }

  function treapLeftRotate(x: INode): INode {
    const y = x.right!;
    x.right = y.left;
    if (y.left) y.left.parent = x;
    y.left = x;
    y.parent = x.parent;
    x.parent = y;
    return y;
  }

  function treapInsertRec(node: INode | null, value: number, p: number, tracked: boolean): INode {
    if (!node) {
      const n = makeINode(value);
      n.priority = p;
      if (tracked) {
        pushSnap(states, events, treapRoot, {
          kind: "place", codeLine: 1,
          message: `Insert node ${value} with priority ${p}.`,
          focus: [n.id],
        }, { currentNodeId: n.id });
      }
      return n;
    }

    if (tracked) {
      pushSnap(states, events, treapRoot ?? node, {
        kind: "compare", codeLine: 2,
        message: `Compare ${value} with node ${node.value}. Go ${value <= node.value ? "left" : "right"}.`,
        focus: [node.id],
      }, { currentNodeId: node.id, comparingValue: value });
    }

    if (value <= node.value) {
      node.left = treapInsertRec(node.left, value, p, tracked);
      node.left.parent = node;
      if (node.left.priority > node.priority) {
        if (tracked) {
          pushSnap(states, events, treapRoot ?? node, {
            kind: "relax", codeLine: 3,
            message: `Priority ${node.left.priority} > ${node.priority}. Right rotate around ${node.value}.`,
            focus: [node.id, node.left.id],
          }, { currentNodeId: node.id });
        }
        node = treapRightRotate(node);
      }
    } else {
      node.right = treapInsertRec(node.right, value, p, tracked);
      node.right.parent = node;
      if (node.right.priority > node.priority) {
        if (tracked) {
          pushSnap(states, events, treapRoot ?? node, {
            kind: "relax", codeLine: 4,
            message: `Priority ${node.right.priority} > ${node.priority}. Left rotate around ${node.value}.`,
            focus: [node.id, node.right.id],
          }, { currentNodeId: node.id });
        }
        node = treapLeftRotate(node);
      }
    }
    return node;
  }

  function treapDeleteRec(node: INode | null, value: number, tracked: boolean): INode | null {
    if (!node) return null;

    if (tracked) {
      pushSnap(states, events, treapRoot, {
        kind: "compare", codeLine: 1,
        message: `Compare ${value} with node ${node.value}.`,
        focus: [node.id],
      }, { currentNodeId: node.id, comparingValue: value });
    }

    if (value < node.value) {
      node.left = treapDeleteRec(node.left, value, tracked);
      if (node.left) node.left.parent = node;
    } else if (value > node.value) {
      node.right = treapDeleteRec(node.right, value, tracked);
      if (node.right) node.right.parent = node;
    } else {
      // Found: rotate down until leaf, then remove
      if (!node.left && !node.right) {
        if (tracked) {
          pushSnap(states, events, treapRoot, {
            kind: "place", codeLine: 5,
            message: `Node ${value} is a leaf. Remove it.`,
            focus: [],
          }, {});
        }
        return null;
      }
      if (!node.right || (node.left && node.left.priority > node.right.priority)) {
        if (tracked) {
          pushSnap(states, events, treapRoot, {
            kind: "relax", codeLine: 3,
            message: `Right rotate to push ${value} down.`,
            focus: [node.id],
          }, { currentNodeId: node.id });
        }
        node = treapRightRotate(node);
        node.right = treapDeleteRec(node.right, value, tracked);
        if (node.right) node.right.parent = node;
      } else {
        if (tracked) {
          pushSnap(states, events, treapRoot, {
            kind: "relax", codeLine: 4,
            message: `Left rotate to push ${value} down.`,
            focus: [node.id],
          }, { currentNodeId: node.id });
        }
        node = treapLeftRotate(node);
        node.left = treapDeleteRec(node.left, value, tracked);
        if (node.left) node.left.parent = node;
      }
    }
    return node;
  }

  // Build initial treap silently
  const buildValues = nodesArr.filter((v): v is string | number => v !== null && v !== undefined);
  for (const [index, v] of buildValues.entries()) {
    const val = toNum(v);
    treapRoot = treapInsertRec(treapRoot, val, input.treapPriorities?.[index] ?? priority(val), false);
  }

  states.push(snap(treapRoot));

  if (operation === "insert") {
    const target = toNum(input.searchTarget ?? input.insertions?.[0] ?? 15);
    const p = input.operationPriority ?? priority(target);
    treapRoot = treapInsertRec(treapRoot, target, p, true);
    pushSnap(states, events, treapRoot, {
      kind: "complete", codeLine: 5,
      message: `Treap insert of ${target} (priority ${p}) complete. BST and max-heap invariants hold.`,
      focus: [],
    }, { complete: true });
  } else if (operation === "delete") {
    const target = toNum(input.searchTarget ?? input.deletions?.[0] ?? buildValues[0]);
    treapRoot = treapDeleteRec(treapRoot, target, true);
    pushSnap(states, events, treapRoot, {
      kind: "complete", codeLine: 6,
      message: `Treap delete of ${target} complete.`,
      focus: [],
    }, { complete: true });
  } else if (operation === "search") {
    const target = toNum(input.searchTarget);
    performSearch(treapRoot, target, states, events);
  } else if (operation === "traverse") {
    const traversed = performTraversal(treapRoot, traversalOrder, states, events);
    if (states.length > 1) {
      states[states.length - 1] = { ...states[states.length - 1], complete: true };
    } else {
      pushSnap(states, events, treapRoot, {
        kind: "complete", codeLine: 4,
        message: `Traversal complete: [${traversed.join(", ")}].`,
        focus: [],
      }, { traversalOrder: traversed, complete: true });
    }
  }

  return { initial: states[0], states, events };
});

/**
 * The shared engine behind the binary-tree and BST lessons.  The legacy
 * exports above remain available for callers that imported them directly,
 * while registry consumers use this one engine with an explicit treeType.
 */
export const treeEngine = engine<TreeScenario, TreeSnapshot>((input) => {
  resetIds();
  const treeType = input.treeType === "bst" ? "bst" : "binary";
  const operation = input.operation ?? "traverse";
  const order = input.traversalOrder ?? "inorder";
  let root = treeType === "bst"
    ? buildBstFromArray(input.nodes ?? [])
    : buildTreeFromLevelOrder(input.nodes ?? []).root;
  const states: TreeSnapshot[] = [snap(root)];
  const events: SimulationEvent[] = [];
  const value = toNum(input.searchTarget ?? input.insertions?.[0] ?? input.deletions?.[0]);

  const findBinary = (target: number): INode | null => {
    const queue = root ? [root] : [];
    while (queue.length) {
      const node = queue.shift()!;
      pushSnap(states, events, root, {
        kind: "compare", codeLine: 1, message: `Compare target ${target} with node ${node.value}.`, focus: [node.id],
      }, { currentNodeId: node.id, comparingValue: target });
      if (node.value === target) return node;
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
    return null;
  };

  if (operation === "traverse") {
    const values = performTraversal(root, order, states, events);
    pushSnap(states, events, root, {
      kind: "complete", codeLine: 4, message: `Traversal complete: [${values.join(", ")}].`, focus: [],
    }, { traversalOrder: values, complete: true });
  } else if (operation === "search") {
    const found = treeType === "bst" ? (() => {
      let node = root;
      while (node) {
        pushSnap(states, events, root, { kind: "compare", codeLine: 1, message: `Compare target ${value} with node ${node.value}.`, focus: [node.id] }, { currentNodeId: node.id, comparingValue: value });
        if (node.value === value) return node;
        node = value < node.value ? node.left : node.right;
      }
      return null;
    })() : findBinary(value);
    pushSnap(states, events, root, {
      kind: "complete", codeLine: found ? 2 : 3,
      message: found ? `Found target value ${value}.` : `Target ${value} is not in the tree.`, focus: found ? [found.id] : [],
    }, { currentNodeId: found?.id ?? null, traversalOrder: found ? [value] : [], complete: true });
  } else if (operation === "insert") {
    const inserted = makeINode(value);
    if (!root) {
      root = inserted;
    } else if (treeType === "bst") {
      let parent = root;
      while (true) {
        pushSnap(states, events, root, { kind: "compare", codeLine: 1, message: `Compare ${value} with node ${parent.value}.`, focus: [parent.id] }, { currentNodeId: parent.id, comparingValue: value });
        const direction = value <= parent.value ? "left" : "right";
        if (!parent[direction]) { parent[direction] = inserted; inserted.parent = parent; break; }
        parent = parent[direction]!;
      }
    } else {
      const queue = [root];
      while (queue.length) {
        const parent = queue.shift()!;
        pushSnap(states, events, root, { kind: "compare", codeLine: 1, message: `Inspect node ${parent.value} for an open child position.`, focus: [parent.id] }, { currentNodeId: parent.id, comparingValue: value });
        if (!parent.left) { parent.left = inserted; inserted.parent = parent; break; }
        if (!parent.right) { parent.right = inserted; inserted.parent = parent; break; }
        queue.push(parent.left, parent.right);
      }
    }
    pushSnap(states, events, root, { kind: "place", codeLine: 2, message: `Insert ${value} into the ${treeType} tree.`, focus: [inserted.id] }, { currentNodeId: inserted.id, complete: true });
  } else if (operation === "delete") {
    const target = treeType === "bst" ? bstFind(root, value) : findBinary(value);
    if (!target) {
      pushSnap(states, events, root, { kind: "complete", codeLine: 2, message: `Value ${value} is not in the tree.`, focus: [] }, { complete: true });
    } else if (treeType === "bst") {
      root = bstDelete(root, value);
      pushSnap(states, events, root, { kind: "place", codeLine: 3, message: `Delete ${value} using BST replacement.`, focus: [] }, { complete: true });
    } else {
      let last = root!;
      const queue = [root!];
      while (queue.length) {
        last = queue.shift()!;
        if (last.left) queue.push(last.left);
        if (last.right) queue.push(last.right);
      }
      if (last !== target) target.value = last.value;
      if (!last.parent) root = null;
      else if (last.parent.left === last) last.parent.left = null;
      else last.parent.right = null;
      pushSnap(states, events, root, { kind: "place", codeLine: 3, message: `Delete ${value} while preserving complete-tree shape.`, focus: [] }, { complete: true });
    }
  }

  return { initial: states[0], states, events };
});

/** A minimum-degree B-tree with the standard split, borrow, and merge rules. */
export const btreeEngine = engine<TreeScenario, TreeSnapshot>((input) => {
  _bNextId = 0;
  const degree = Math.max(2, Math.floor(input.btreeOrder ?? 2));
  const maxKeys = 2 * degree - 1;
  const operation = input.operation ?? "insert";
  const values = (input.nodes ?? []).filter((item): item is string | number => item !== null && item !== undefined).map(toNum);
  let root: BNode | null = null;
  const states: TreeSnapshot[] = [];
  const events: SimulationEvent[] = [];
  const trace = (kind: SimulationEvent["kind"], message: string, focus: string[] = [], extra?: Partial<TreeSnapshot>) => {
    states.push(snapB(root, extra));
    events.push({ kind, codeLine: 1, message, focus });
  };
  const node = (keys: number[] = [], leaf = true): BNode => ({ id: newBId(), keys, children: [], leaf });

  const split = (parent: BNode, index: number, tracked: boolean) => {
    const full = parent.children[index];
    const right = node(full.keys.splice(degree), full.leaf);
    const middle = full.keys.pop()!;
    if (!full.leaf) right.children = full.children.splice(degree);
    parent.keys.splice(index, 0, middle);
    parent.children.splice(index + 1, 0, right);
    if (tracked) trace("relax", `Split full node and promote ${middle}.`, [parent.id, full.id, right.id], { currentNodeId: parent.id });
  };

  const insert = (key: number, tracked: boolean) => {
    if (!root) {
      root = node([key]);
      if (tracked) trace("place", `Create root with key ${key}.`, [root.id], { currentNodeId: root.id });
      return;
    }
    if (root.keys.length === maxKeys) {
      const old = root;
      root = node([], false);
      root.children.push(old);
      split(root, 0, tracked);
    }
    const add = (current: BNode): void => {
      let index = current.keys.length - 1;
      if (current.leaf) {
        while (index >= 0 && key < current.keys[index]) index--;
        current.keys.splice(index + 1, 0, key);
        if (tracked) trace("place", `Insert ${key} into leaf [${current.keys.join(", ")}].`, [current.id], { currentNodeId: current.id });
        return;
      }
      while (index >= 0 && key < current.keys[index]) index--;
      index++;
      if (tracked) trace("compare", `Choose child ${index} of [${current.keys.join(", ")}].`, [current.id], { currentNodeId: current.id, comparingValue: key });
      if (current.children[index].keys.length === maxKeys) {
        split(current, index, tracked);
        if (key > current.keys[index]) index++;
      }
      add(current.children[index]);
    };
    add(root);
  };

  const borrowPrevious = (parent: BNode, index: number, tracked: boolean) => {
    const child = parent.children[index];
    const sibling = parent.children[index - 1];
    child.keys.unshift(parent.keys[index - 1]);
    parent.keys[index - 1] = sibling.keys.pop()!;
    if (!sibling.leaf) child.children.unshift(sibling.children.pop()!);
    if (tracked) trace("relax", `Borrow a key from the left sibling.`, [parent.id, child.id, sibling.id], { currentNodeId: child.id });
  };
  const borrowNext = (parent: BNode, index: number, tracked: boolean) => {
    const child = parent.children[index];
    const sibling = parent.children[index + 1];
    child.keys.push(parent.keys[index]);
    parent.keys[index] = sibling.keys.shift()!;
    if (!sibling.leaf) child.children.push(sibling.children.shift()!);
    if (tracked) trace("relax", `Borrow a key from the right sibling.`, [parent.id, child.id, sibling.id], { currentNodeId: child.id });
  };
  const merge = (parent: BNode, index: number, tracked: boolean) => {
    const left = parent.children[index];
    const right = parent.children[index + 1];
    left.keys.push(parent.keys.splice(index, 1)[0], ...right.keys);
    if (!left.leaf) left.children.push(...right.children);
    parent.children.splice(index + 1, 1);
    if (tracked) trace("relax", `Merge siblings around separator into [${left.keys.join(", ")}].`, [parent.id, left.id], { currentNodeId: left.id });
    return left;
  };
  const rightmost = (current: BNode): number => current.leaf ? current.keys.at(-1)! : rightmost(current.children.at(-1)!);
  const leftmost = (current: BNode): number => current.leaf ? current.keys[0] : leftmost(current.children[0]);

  const remove = (current: BNode, key: number, tracked: boolean): boolean => {
    let index = 0;
    while (index < current.keys.length && current.keys[index] < key) index++;
    if (index < current.keys.length && current.keys[index] === key) {
      if (current.leaf) {
        current.keys.splice(index, 1);
        if (tracked) trace("place", `Remove ${key} from leaf.`, [current.id], { currentNodeId: current.id });
        return true;
      }
      const left = current.children[index];
      const right = current.children[index + 1];
      if (left.keys.length >= degree) {
        const predecessor = rightmost(left);
        current.keys[index] = predecessor;
        if (tracked) trace("place", `Replace ${key} with predecessor ${predecessor}.`, [current.id], { currentNodeId: current.id });
        return remove(left, predecessor, tracked);
      }
      if (right.keys.length >= degree) {
        const successor = leftmost(right);
        current.keys[index] = successor;
        if (tracked) trace("place", `Replace ${key} with successor ${successor}.`, [current.id], { currentNodeId: current.id });
        return remove(right, successor, tracked);
      }
      return remove(merge(current, index, tracked), key, tracked);
    }
    if (current.leaf) return false;
    if (current.children[index].keys.length === degree - 1) {
      if (index > 0 && current.children[index - 1].keys.length >= degree) borrowPrevious(current, index, tracked);
      else if (index < current.children.length - 1 && current.children[index + 1].keys.length >= degree) borrowNext(current, index, tracked);
      else if (index < current.children.length - 1) merge(current, index, tracked);
      else { merge(current, index - 1, tracked); index--; }
    }
    return remove(current.children[index], key, tracked);
  };

  for (const value of values) insert(value, false);
  states.push(snapB(root));
  const value = toNum(input.searchTarget ?? input.insertions?.[0] ?? input.deletions?.[0]);
  if (operation === "insert") {
    insert(value, true);
    trace("complete", `B-tree insert of ${value} complete.`, [], { complete: true });
  } else if (operation === "delete") {
    const currentRoot = root as BNode | null;
    const deleted = currentRoot ? remove(currentRoot, value, true) : false;
    if (currentRoot && currentRoot.keys.length === 0) root = currentRoot.leaf ? null : currentRoot.children[0];
    trace("complete", deleted ? `B-tree delete of ${value} complete.` : `Key ${value} was not found.`, [], { complete: true });
  } else if (operation === "search") {
    let current: BNode | null = root as BNode | null;
    let found: BNode | null = null;
    while (current) {
      trace("compare", `Search node [${current.keys.join(", ")}].`, [current.id], { currentNodeId: current.id, comparingValue: value });
      let index = 0;
      while (index < current.keys.length && value > current.keys[index]) index++;
      if (current.keys[index] === value) { found = current; break; }
      current = current.leaf ? null : current.children[index];
    }
    trace("complete", found ? `Found ${value}.` : `Key ${value} was not found.`, found ? [found.id] : [], { currentNodeId: found?.id ?? null, traversalOrder: found ? [value] : [], complete: true });
  }
  return { initial: states[0], states, events };
});
