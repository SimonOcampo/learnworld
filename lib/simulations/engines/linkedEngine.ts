import { engine } from "../../engines";
import type { LinkedScenario, SimulationRun, SimulationEvent } from "../../types";

export type LinkedNode = {
  id: string;
  value: string;
  next: string | null;
  express?: string | null;
  level?: number;
};

export type LinkedSnapshot = {
  nodes: LinkedNode[];
  head: string | null;
  currentIndex: number | null;
  currentNodeId: string | null;
  prevNodeId: string | null;
  complete: boolean;
};

function runLinkedListSimulation(input: LinkedScenario): SimulationRun<LinkedSnapshot> {
  const initialValues = input.values || [];
  const operation = input.operation;
  const operand = input.operand;
  const position = input.position ?? 0;

  const nodes: LinkedNode[] = initialValues.map((v, i) => ({
    id: `node_${i}`,
    value: v,
    next: i < initialValues.length - 1 ? `node_${i+1}` : null
  }));

  let head = nodes.length > 0 ? "node_0" : null;

  const states: LinkedSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (
    headId: string | null,
    nodesList: LinkedNode[],
    currIdx: number | null,
    currNodeId: string | null,
    prevNodeId: string | null,
    complete: boolean,
    event: SimulationEvent
  ) => {
    states.push({
      nodes: nodesList.map(n => ({ ...n })),
      head: headId,
      currentIndex: currIdx,
      currentNodeId: currNodeId,
      prevNodeId,
      complete
    });
    events.push(event);
  };

  const initialSnapshot: LinkedSnapshot = {
    nodes: nodes.map(n => ({ ...n })),
    head,
    currentIndex: null,
    currentNodeId: null,
    prevNodeId: null,
    complete: false
  };
  states.push(initialSnapshot);

  if (operation === "search") {
    let currId: string | null = head;
    let prevId: string | null = null;
    let idx = 0;
    let found = false;

    while (currId !== null) {
      const node = nodes.find(n => n.id === currId)!;
      pushState(
        head,
        nodes,
        idx,
        currId,
        prevId,
        false,
        {
          kind: "compare",
          codeLine: 1,
          message: `Check node at index ${idx}: '${node.value}' vs search target '${operand}'.`,
          focus: [currId]
        }
      );

      if (node.value === operand) {
        found = true;
        pushState(
          head,
          nodes,
          idx,
          currId,
          prevId,
          true,
          {
            kind: "complete",
            codeLine: 2,
            message: `Found target '${operand}' at index ${idx}.`,
            focus: [currId]
          }
        );
        break;
      }

      prevId = currId;
      currId = node.next;
      idx++;
    }

    if (!found) {
      pushState(
        head,
        nodes,
        null,
        null,
        prevId,
        true,
        {
          kind: "complete",
          codeLine: 3,
          message: `Target '${operand}' not found in the list.`,
          focus: []
        }
      );
    }
  } else if (operation === "insert") {
    const newId = `node_${nodes.reduce((max, node) => Math.max(max, Number(node.id.replace("node_", "")) || 0), -1) + 1}`;
    const newValue = operand || "new_item";
    const newNode: LinkedNode = { id: newId, value: newValue, next: null };

    if (position <= 0 || head === null) {
      newNode.next = head;
      nodes.push(newNode);
      head = newId;
      pushState(
        head,
        nodes,
        0,
        newId,
        null,
        true,
        {
          kind: "place",
          codeLine: 4,
          message: `Inserted new node '${newValue}' at the head of the list.`,
          focus: [newId]
        }
      );
    } else {
      let currId: string | null = head;
      let prevId: string | null = null;
      let idx = 0;

      while (currId !== null && idx < position) {
        const node = nodes.find(n => n.id === currId)!;
        pushState(
          head,
          nodes,
          idx,
          currId,
          prevId,
          false,
          {
            kind: "visit",
            codeLine: 1,
            message: `Traversing: at index ${idx} ('${node.value}').`,
            focus: [currId]
          }
        );
        prevId = currId;
        currId = node.next;
        idx++;
      }

      if (prevId) {
        const prevNode = nodes.find(n => n.id === prevId)!;
        newNode.next = currId;
        prevNode.next = newId;
        nodes.push(newNode);

        pushState(
          head,
          nodes,
          idx,
          newId,
          prevId,
          true,
          {
            kind: "place",
            codeLine: 5,
            message: `Inserted new node '${newValue}' at index ${idx}.`,
            focus: [newId, prevId]
          }
        );
      }
    }
  } else if (operation === "delete") {
    let targetId: string | null = null;
    let prevId: string | null = null;
    let currId: string | null = head;
    let idx = 0;

    while (currId !== null) {
      const node = nodes.find(n => n.id === currId)!;
      const isTarget = operand ? node.value === operand : idx === position;

      pushState(
        head,
        nodes,
        idx,
        currId,
        prevId,
        false,
        {
          kind: "visit",
          codeLine: 1,
          message: `Checking node at index ${idx} ('${node.value}').`,
          focus: [currId]
        }
      );

      if (isTarget) {
        targetId = currId;
        break;
      }

      prevId = currId;
      currId = node.next;
      idx++;
    }

    if (targetId !== null) {
      const targetNode = nodes.find(n => n.id === targetId)!;
      if (prevId === null) {
        head = targetNode.next;
      } else {
        const prevNode = nodes.find(n => n.id === prevId)!;
        prevNode.next = targetNode.next;
      }
      const updatedNodes = nodes.filter(n => n.id !== targetId);

      pushState(
        head,
        updatedNodes,
        idx,
        null,
        prevId,
        true,
        {
          kind: "shift",
          codeLine: 6,
          message: `Removed node '${targetNode.value}' at index ${idx} and rewired link.`,
          focus: prevId ? [prevId] : []
        }
      );
    } else {
      pushState(
        head,
        nodes,
        null,
        null,
        prevId,
        true,
        {
          kind: "complete",
          codeLine: 7,
          message: `Deletion target not found.`,
          focus: []
        }
      );
    }
  } else if (operation === "reverse") {
    let prevId: string | null = null;
    let currId: string | null = head;
    let idx = 0;

    while (currId !== null) {
      const currNode = nodes.find(n => n.id === currId)!;
      const nextId = currNode.next;

      pushState(
        head,
        nodes,
        idx,
        currId,
        prevId,
        false,
        {
          kind: "visit",
          codeLine: 1,
          message: `Reversing: current node is '${currNode.value}'.`,
          focus: [currId]
        }
      );

      currNode.next = prevId;
      prevId = currId;
      currId = nextId;
      idx++;
    }

    head = prevId;
    pushState(
      head,
      nodes,
      null,
      null,
      null,
      true,
      {
        kind: "complete",
        codeLine: 8,
        message: `Successfully reversed the linked list. New head is '${nodes.find(n => n.id === head)?.value || "null"}'.`,
        focus: head ? [head] : []
      }
    );
  }

  return { initial: states[0], states, events };
}

function runSkipListSimulation(input: LinkedScenario): SimulationRun<LinkedSnapshot> {
  const values = [...input.values].sort((a, b) => Number(a) - Number(b));
  const target = input.operand || "0";

  const nodes: LinkedNode[] = values.map((val, i) => {
    const isExpress = i % 2 === 0;
    let expressNext: string | null = null;
    if (isExpress && i + 2 < values.length) {
      expressNext = `node_${i+2}`;
    }
    return {
      id: `node_${i}`,
      value: val,
      next: i < values.length - 1 ? `node_${i+1}` : null,
      express: expressNext,
      level: isExpress ? 1 : 0
    };
  });

  const head = nodes.length > 0 ? "node_0" : null;

  const states: LinkedSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (currNodeId: string | null, level: number, complete: boolean, event: SimulationEvent) => {
    states.push({
      nodes: nodes.map(n => ({ ...n })),
      head,
      currentIndex: currNodeId ? Number(currNodeId.split("_")[1]) : null,
      currentNodeId: currNodeId,
      prevNodeId: null,
      complete
    });
    events.push(event);
  };

  pushState(null, 1, false, {
    kind: "visit",
    codeLine: 1,
    message: `Initialized skip list with two levels. Searching for '${target}'.`,
    focus: []
  });

  let currId: string | null = head;
  let currentLevel = 1;
  let found = false;

  while (currId !== null) {
    const currNode = nodes.find(n => n.id === currId)!;
    pushState(currId, currentLevel, false, {
      kind: "compare",
      codeLine: 2,
      message: `Search at Level ${currentLevel}: comparing '${currNode.value}' with target '${target}'.`,
      focus: [currId]
    });

    if (Number(currNode.value) === Number(target)) {
      found = true;
      pushState(currId, currentLevel, true, {
        kind: "complete",
        codeLine: 3,
        message: `Found target '${target}' at Level ${currentLevel} node.`,
        focus: [currId]
      });
      break;
    }

    if (currentLevel === 1) {
      const nextExpressId = currNode.express;
      if (nextExpressId) {
        const nextExpressNode = nodes.find(n => n.id === nextExpressId)!;
        if (Number(nextExpressNode.value) <= Number(target)) {
          currId = nextExpressId;
          continue;
        }
      }
      currentLevel = 0;
      pushState(currId, currentLevel, false, {
        kind: "narrow-range",
        codeLine: 4,
        message: `Cannot advance further at Level 1. Dropping down to Level 0 at node '${currNode.value}'.`,
        focus: [currId]
      });
    } else {
      const nextId = currNode.next;
      if (nextId !== null) {
        const nextNode = nodes.find(n => n.id === nextId)!;
        if (Number(nextNode.value) <= Number(target)) {
          currId = nextId;
          continue;
        }
      }
      break;
    }
  }

  if (!found) {
    pushState(null, 0, true, {
      kind: "complete",
      codeLine: 5,
      message: `Target '${target}' not found in the skip list.`,
      focus: []
    });
  }

  return { initial: states[0], states, events };
}

export const linkedListEngine = engine<LinkedScenario, LinkedSnapshot>((input) => runLinkedListSimulation(input));
export const skipListEngine = engine<LinkedScenario, LinkedSnapshot>((input) => runSkipListSimulation(input));
