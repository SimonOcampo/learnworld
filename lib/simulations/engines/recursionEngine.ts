import { engine } from "../../engines";
import type { CallStackScenario, SimulationEvent } from "../../types";

export type CallStackFrame = {
  functionName: string;
  arg: number;
  returnValue?: number;
};

export type CallStackSnapshot = {
  stack: CallStackFrame[];
  returnValue: number | null;
  complete: boolean;
};

export const recursionEngine = engine<CallStackScenario, CallStackSnapshot>((input) => {
  const functionName = input.functionName || "factorial";
  const initialArg = input.initialArg ?? 3;

  const states: CallStackSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (stack: CallStackFrame[], returnValue: number | null, complete: boolean, event: SimulationEvent) => {
    states.push({
      stack: stack.map(f => ({ ...f })),
      returnValue,
      complete
    });
    events.push(event);
  };

  const initial: CallStackSnapshot = {
    stack: [],
    returnValue: null,
    complete: false
  };
  states.push(initial);

  const isFib = functionName.toLowerCase().startsWith("fib");

  if (isFib) {
    // Trace Fibonacci recursion
    // Fibonacci recursive calls can form a tree. Let's do a postorder-like trace of the call stack.
    // To keep it simple and clean, let's trace a standard DFS traversal of the recursion tree.
    
    const stackTrace: CallStackFrame[] = [];

    const fibTrace = (n: number): number => {
      const frame: CallStackFrame = { functionName, arg: n };
      stackTrace.push(frame);
      pushState(
        stackTrace,
        null,
        false,
        {
          kind: "enqueue",
          codeLine: 1,
          message: `Push frame: ${functionName}(${n}) called.`
        }
      );

      if (n <= 1) {
        frame.returnValue = n;
        pushState(
          stackTrace,
          null,
          false,
          {
            kind: "compare",
            codeLine: 2,
            message: `Base case reached: ${functionName}(${n}) returns ${n}.`
          }
        );
        stackTrace.pop();
        return n;
      }

      const left = fibTrace(n - 1);
      const right = fibTrace(n - 2);
      const result = left + right;

      // When returning to this frame
      const currentFrame = stackTrace.find(f => f.arg === n);
      if (currentFrame) {
        currentFrame.returnValue = result;
      }

      pushState(
        stackTrace,
        null,
        false,
        {
          kind: "relax",
          codeLine: 3,
          message: `Resolve frames: ${functionName}(${n}) returns ${left} + ${right} = ${result}.`
        }
      );
      stackTrace.pop();
      return result;
    };

    const finalVal = fibTrace(initialArg);
    pushState(
      [],
      finalVal,
      true,
      {
        kind: "complete",
        codeLine: 4,
        message: `Recursion complete. Final return value is ${finalVal}.`
      }
    );

  } else {
    // Trace Factorial recursion (linear)
    const stackTrace: CallStackFrame[] = [];
    const args: number[] = [];
    let current = initialArg;
    
    // Phase 1: recursive calls down to base case
    while (current >= 1) {
      stackTrace.push({ functionName, arg: current });
      args.push(current);
      pushState(
        stackTrace,
        null,
        false,
        {
          kind: "enqueue",
          codeLine: 1,
          message: `Push frame: ${functionName}(${current}) called.`
        }
      );
      current--;
    }

    // Base case: factorial(1) or factorial(0)
    let accumVal = 1;
    const baseFrame = stackTrace[stackTrace.length - 1];
    if (baseFrame) {
      baseFrame.returnValue = accumVal;
    }
    pushState(
      stackTrace,
      null,
      false,
      {
        kind: "compare",
        codeLine: 2,
        message: `Base case reached: ${functionName}(${args[args.length - 1]}) returns ${accumVal}.`
      }
    );

    // Phase 2: return upward and pop frames
    for (let i = args.length - 2; i >= 0; i--) {
      const arg = args[i];
      accumVal = accumVal * arg;
      stackTrace.pop();
      const parentFrame = stackTrace[stackTrace.length - 1];
      if (parentFrame) {
        parentFrame.returnValue = accumVal;
      }
      pushState(
        stackTrace,
        null,
        false,
        {
          kind: "relax",
          codeLine: 3,
          message: `Return upward: ${functionName}(${arg}) returns ${arg} * ${accumVal / arg} = ${accumVal}.`
        }
      );
    }

    stackTrace.pop();
    pushState(
      [],
      accumVal,
      true,
      {
        kind: "complete",
        codeLine: 4,
        message: `Recursion complete. Final return value is ${accumVal}.`
      }
    );
  }

  return { initial: states[0], states, events };
});
