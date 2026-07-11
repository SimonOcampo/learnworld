import { engine } from "../../engines";
import type { RecurrenceScenario, SimulationEvent } from "../../types";

export type RecurrenceSnapshot = {
  a: number;
  b: number;
  fn: string;
  n: number;
  log_b_a: number;
  applicableCase: 1 | 2 | 3 | null;
  complexityBound: string;
  currentSubproblemSize?: number;
  subproblemCount?: number;
  complete: boolean;
};

export const masterTheoremEngine = engine<RecurrenceScenario, RecurrenceSnapshot>((input) => {
  const a = input.a ?? 2;
  const b = input.b ?? 2;
  const fn = input.fn || "n";
  const n = input.n ?? 8;

  const log_b_a = Math.log(a) / Math.log(b);

  const states: RecurrenceSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (appCase: 1 | 2 | 3 | null, bound: string, complete: boolean, event: SimulationEvent) => {
    states.push({
      a,
      b,
      fn,
      n,
      log_b_a,
      applicableCase: appCase,
      complexityBound: bound,
      complete
    });
    events.push(event);
  };

  pushState(null, "", false, {
    kind: "visit",
    codeLine: 1,
    message: `Initialized recurrence: T(n) = ${a}T(n/${b}) + O(${fn}).`,
    focus: []
  });

  // Determine fn growth exponent
  let fnExp = 0;
  if (fn.includes("n^2")) fnExp = 2;
  else if (fn.includes("n^3")) fnExp = 3;
  else if (fn.includes("n")) fnExp = 1;

  pushState(null, "", false, {
    kind: "compare",
    codeLine: 2,
    message: `Compute log_b(a) = log_${b}(${a}) ≈ ${log_b_a.toFixed(2)}. Compare f(n) = O(n^${fnExp}) with n^(log_b(a)) = n^${log_b_a.toFixed(2)}.`,
    focus: []
  });

  let appCase: 1 | 2 | 3 = 2;
  let bound = "";

  if (fnExp < log_b_a) {
    appCase = 1;
    bound = `Theta(n^${log_b_a.toFixed(1)})`;
  } else if (Math.abs(fnExp - log_b_a) < 0.01) {
    appCase = 2;
    bound = `Theta(n^${log_b_a.toFixed(1)} * log n)`;
  } else {
    appCase = 3;
    bound = `Theta(${fn})`;
  }

  pushState(appCase, bound, false, {
    kind: "relax",
    codeLine: 3,
    message: `Matched Master Theorem Case ${appCase}: f(n) is ${appCase === 1 ? "slower than" : appCase === 2 ? "equal to" : "faster than"} n^log_b(a).`,
    focus: []
  });

  pushState(appCase, bound, true, {
    kind: "complete",
    codeLine: 4,
    message: `Asymptotic complexity bound is: ${bound}.`,
    focus: []
  });

  return { initial: states[0], states, events };
});

export const divideAndConquerEngine = engine<RecurrenceScenario, RecurrenceSnapshot>((input) => {
  const a = input.a ?? 2;
  const b = input.b ?? 2;
  const fn = input.fn || "n";
  const n = input.n ?? 8;

  const log_b_a = Math.log(a) / Math.log(b);

  const states: RecurrenceSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (subSize: number, subCount: number, complete: boolean, event: SimulationEvent) => {
    states.push({
      a,
      b,
      fn,
      n,
      log_b_a,
      applicableCase: null,
      complexityBound: "",
      currentSubproblemSize: subSize,
      subproblemCount: subCount,
      complete
    });
    events.push(event);
  };

  const initial: RecurrenceSnapshot = {
    a,
    b,
    fn,
    n,
    log_b_a,
    applicableCase: null,
    complexityBound: "",
    currentSubproblemSize: n,
    subproblemCount: 1,
    complete: false
  };
  states.push(initial);

  let currentSize = n;
  let currentCount = 1;

  while (currentSize > 1) {
    const nextSize = Math.max(1, currentSize / b);
    const nextCount = currentCount * a;

    pushState(nextSize, nextCount, false, {
      kind: "narrow-range",
      codeLine: 1,
      message: `Divide: Split ${currentCount} subproblems of size ${currentSize} into ${nextCount} subproblems of size ${nextSize}.`,
      focus: []
    });

    currentSize = nextSize;
    currentCount = nextCount;
  }

  pushState(currentSize, currentCount, false, {
    kind: "compare",
    codeLine: 2,
    message: `Conquer: Base cases reached (size <= 1). Solving ${currentCount} trivial subproblems.`,
    focus: []
  });

  pushState(n, 1, true, {
    kind: "complete",
    codeLine: 3,
    message: `Combine: Recombining solved subproblems back up to original size ${n}.`,
    focus: []
  });

  return { initial: states[0], states, events };
});
