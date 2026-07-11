import { engine } from "../../engines";
import type { LinearAdtScenario, SimulationRun, SimulationEvent } from "../../types";

export type LinearAdtSnapshot = {
  items: string[];
  operationIndex: number | null;
  activeItem: string | null;
  complete: boolean;
};

function runLinearAdtSimulation(input: LinearAdtScenario, isStack: boolean): SimulationRun<LinearAdtSnapshot> {
  const items = [...input.values];
  const operations = input.operations || [];

  const states: LinearAdtSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (
    currentItems: string[],
    opIdx: number | null,
    activeItem: string | null,
    complete: boolean,
    event: SimulationEvent
  ) => {
    states.push({
      items: [...currentItems],
      operationIndex: opIdx,
      activeItem,
      complete
    });
    events.push(event);
  };

  const initialSnapshot: LinearAdtSnapshot = {
    items: [...items],
    operationIndex: null,
    activeItem: null,
    complete: false
  };
  states.push(initialSnapshot);

  const currentItems = [...items];

  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    const complete = (i === operations.length - 1);

    if (isStack) {
      if (op.type === "push") {
        const val = op.value || "item";
        currentItems.push(val);
        pushState(
          currentItems,
          i,
          val,
          complete,
          {
            kind: "enqueue",
            codeLine: 1,
            message: `Push: Added '${val}' to top of stack.`,
            focus: [val]
          }
        );
      } else if (op.type === "pop") {
        const val = currentItems.pop() || null;
        pushState(
          currentItems,
          i,
          val,
          complete,
          {
            kind: "visit",
            codeLine: 2,
            message: val ? `Pop: Removed '${val}' from top of stack.` : `Pop: Stack is empty.`,
            focus: val ? [val] : []
          }
        );
      }
    } else {
      if (op.type === "enqueue" || op.type === "push") {
        const val = op.value || "item";
        currentItems.push(val);
        pushState(
          currentItems,
          i,
          val,
          complete,
          {
            kind: "enqueue",
            codeLine: 1,
            message: `Enqueue: Added '${val}' to rear of queue.`,
            focus: [val]
          }
        );
      } else if (op.type === "dequeue" || op.type === "pop") {
        const val = currentItems.shift() || null;
        pushState(
          currentItems,
          i,
          val,
          complete,
          {
            kind: "visit",
            codeLine: 2,
            message: val ? `Dequeue: Removed '${val}' from front of queue.` : `Dequeue: Queue is empty.`,
            focus: val ? [val] : []
          }
        );
      }
    }
  }

  if (operations.length === 0) {
    initialSnapshot.complete = true;
  } else {
    states[states.length - 1].complete = true;
  }

  return { initial: states[0], states, events };
}

export const stacksEngine = engine<LinearAdtScenario, LinearAdtSnapshot>((input) => runLinearAdtSimulation(input, true));
export const queuesEngine = engine<LinearAdtScenario, LinearAdtSnapshot>((input) => runLinearAdtSimulation(input, false));
