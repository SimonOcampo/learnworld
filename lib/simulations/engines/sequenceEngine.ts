import { engine } from "../../engines";
import type { SequenceScenario, SimulationRun, SimulationEvent } from "../../types";

export type SequenceSnapshot = {
  elements: (string | number)[];
  activeIndex: number | null;
  targetIndex: number | null;
  targetValue: string | number | null;
  comparing: number[];
  complete: boolean;
};

function runSequenceSimulation(input: SequenceScenario): SimulationRun<SequenceSnapshot> {
  const elements = [...input.elements];
  const activeIndex = input.activeIndex ?? 0;
  const targetIndex = input.targetIndex ?? null;
  const targetValue = input.targetValue ?? null;
  const operationType = input.operationType;

  // Auto-detect string mode by checking for null terminator
  const isString = elements.some(el => el === "\0" || el === "\\0");

  const states: SequenceSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (state: SequenceSnapshot, event: SimulationEvent) => {
    states.push({
      ...state,
      elements: [...state.elements],
      comparing: [...state.comparing]
    });
    events.push(event);
  };

  const initial: SequenceSnapshot = {
    elements: [...elements],
    activeIndex: null,
    targetIndex,
    targetValue,
    comparing: [],
    complete: false
  };
  states.push(initial);

  let i = activeIndex;
  let finished = false;

  while (i < elements.length && !finished) {
    if (isString && (elements[i] === "\0" || elements[i] === "\\0")) {
      pushState(
        {
          elements: [...elements],
          activeIndex: i,
          targetIndex,
          targetValue,
          comparing: [i],
          complete: true
        },
        {
          kind: "compare",
          codeLine: 2,
          message: `Encountered null terminator '\\0' at index ${i}. Terminating string operation.`,
          focus: [String(i)]
        }
      );
      finished = true;
      break;
    }

    if (operationType === "traverse") {
      pushState(
        {
          elements: [...elements],
          activeIndex: i,
          targetIndex,
          targetValue,
          comparing: [i],
          complete: i === elements.length - 1
        },
        {
          kind: "visit",
          codeLine: 1,
          message: `Traversed to index ${i}, value is '${elements[i]}'.`,
          focus: [String(i)]
        }
      );
      i++;
    } else if (operationType === "read") {
      if (i === targetIndex) {
        pushState(
          {
            elements: [...elements],
            activeIndex: i,
            targetIndex,
            targetValue,
            comparing: [i],
            complete: true
          },
          {
            kind: "place",
            codeLine: 3,
            message: `Found target index ${i}. Read value is '${elements[i]}'.`,
            focus: [String(i)]
          }
        );
        finished = true;
      } else {
        pushState(
          {
            elements: [...elements],
            activeIndex: i,
            targetIndex,
            targetValue,
            comparing: [i],
            complete: false
          },
          {
            kind: "visit",
            codeLine: 1,
            message: `Searching for index ${targetIndex}. Passing index ${i} with value '${elements[i]}'.`,
            focus: [String(i)]
          }
        );
        i++;
      }
    } else if (operationType === "write") {
      if (i === targetIndex) {
        if (targetValue !== null) {
          elements[i] = targetValue;
        }
        pushState(
          {
            elements: [...elements],
            activeIndex: i,
            targetIndex,
            targetValue,
            comparing: [i],
            complete: true
          },
          {
            kind: "place",
            codeLine: 4,
            message: `Reached target index ${i}. Wrote value '${targetValue}'.`,
            focus: [String(i)]
          }
        );
        finished = true;
      } else {
        pushState(
          {
            elements: [...elements],
            activeIndex: i,
            targetIndex,
            targetValue,
            comparing: [i],
            complete: false
          },
          {
            kind: "visit",
            codeLine: 1,
            message: `Searching for index ${targetIndex}. Passing index ${i} with value '${elements[i]}'.`,
            focus: [String(i)]
          }
        );
        i++;
      }
    }
  }

  if (states.length > 1 && !finished) {
    states[states.length - 1].complete = true;
  } else if (states.length === 1) {
    states[0].complete = true;
  }

  return { initial: states[0], states, events };
}

/** Unified sequence engine — handles both string and array concepts.
 *  String mode is auto-detected by the presence of a null terminator element. */
export const sequenceEngine = engine<SequenceScenario, SequenceSnapshot>((input) => runSequenceSimulation(input));

// Legacy aliases for backward compatibility with imports
export const stringsEngine = sequenceEngine;
export const arraysEngine = sequenceEngine;
