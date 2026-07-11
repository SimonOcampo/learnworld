import { engine } from "../../engines";
import type { ComplexityScenario, SimulationEvent } from "../../types";

export type ComplexitySnapshot = {
  f_n: string;
  g_n: string;
  c: number | null;
  n0: number | null;
  currentN: number | null;
  f_val: number | null;
  g_val: number | null;
  relationshipSatisfied: boolean | null;
  complete: boolean;
};

function evaluateComplexity(expr: string, n: number): number {
  const cleanExpr = expr.replace(/\s+/g, "").toLowerCase();
  if (cleanExpr.includes("n^3")) return n * n * n;
  if (cleanExpr.includes("n^2")) return n * n;
  if (cleanExpr.includes("nlogn") || cleanExpr.includes("n*log")) return n * Math.log2(n || 1);
  if (cleanExpr.includes("logn") || cleanExpr.includes("log(n)")) return Math.log2(n || 1);
  if (cleanExpr.includes("2^n")) return Math.pow(2, n);
  if (cleanExpr.includes("n")) return n;
  return 1; // constant fallback
}

export const algAnalysisEngine = engine<ComplexityScenario, ComplexitySnapshot>((input) => {
  const f_n = input.f_n || "n^2";
  const limit = input.n ?? 4;
  const states: ComplexitySnapshot[] = [];
  const events: SimulationEvent[] = [];

  const initial: ComplexitySnapshot = {
    f_n,
    g_n: "",
    c: null,
    n0: null,
    currentN: null,
    f_val: null,
    g_val: null,
    relationshipSatisfied: null,
    complete: false
  };
  states.push(initial);

  for (let n = 1; n <= limit; n++) {
    const f_val = Math.round(evaluateComplexity(f_n, n));
    states.push({
      f_n,
      g_n: "",
      c: null,
      n0: null,
      currentN: n,
      f_val,
      g_val: null,
      relationshipSatisfied: null,
      complete: n === limit
    });
    events.push({
      kind: "visit",
      codeLine: 1,
      message: `Analyzing input size n = ${n}. Counted operation steps: ${f_val}.`,
      focus: []
    });
  }

  states[states.length - 1].complete = true;
  return { initial: states[0], states, events };
});

export const growthOfFunctionsEngine = engine<ComplexityScenario, ComplexitySnapshot>((input) => {
  const f_n = input.f_n || "n^2";
  const g_n = input.g_n || "n";
  const limit = 4;
  const states: ComplexitySnapshot[] = [];
  const events: SimulationEvent[] = [];

  const initial: ComplexitySnapshot = {
    f_n,
    g_n,
    c: null,
    n0: null,
    currentN: null,
    f_val: null,
    g_val: null,
    relationshipSatisfied: null,
    complete: false
  };
  states.push(initial);

  for (let step = 1; step <= limit; step++) {
    const n = Math.pow(2, step); // test at n = 2, 4, 8, 16
    const f_val = Math.round(evaluateComplexity(f_n, n));
    const g_val = Math.round(evaluateComplexity(g_n, n));
    states.push({
      f_n,
      g_n,
      c: null,
      n0: null,
      currentN: n,
      f_val,
      g_val,
      relationshipSatisfied: f_val > g_val,
      complete: step === limit
    });
    events.push({
      kind: "compare",
      codeLine: 2,
      message: `At n = ${n}: f(n) = ${f_val} vs g(n) = ${g_val}. ${f_val > g_val ? "f(n) grows faster." : "f(n) does not grow faster."}`,
      focus: []
    });
  }

  states[states.length - 1].complete = true;
  return { initial: states[0], states, events };
});

export const bigOEngine = engine<ComplexityScenario, ComplexitySnapshot>((input) => {
  const f_n = input.f_n || "n";
  const g_n = input.g_n || "n^2";
  const c = input.c ?? 1;
  const n0 = input.n0 ?? 2;

  const states: ComplexitySnapshot[] = [];
  const events: SimulationEvent[] = [];

  const initial: ComplexitySnapshot = {
    f_n,
    g_n,
    c,
    n0,
    currentN: null,
    f_val: null,
    g_val: null,
    relationshipSatisfied: null,
    complete: false
  };
  states.push(initial);

  // Test n around n0
  const startN = Math.max(1, n0 - 2);
  const endN = n0 + 2;

  for (let n = startN; n <= endN; n++) {
    const f_val = evaluateComplexity(f_n, n);
    const g_val = evaluateComplexity(g_n, n);
    const rhs = c * g_val;
    const satisfied = f_val <= rhs;
    const isN0OrAbove = n >= n0;

    states.push({
      f_n,
      g_n,
      c,
      n0,
      currentN: n,
      f_val,
      g_val: rhs,
      relationshipSatisfied: satisfied,
      complete: n === endN
    });

    events.push({
      kind: satisfied ? "relax" : "compare",
      codeLine: 3,
      message: `Testing n = ${n}: f(n) = ${f_val} <= c * g(n) = ${rhs}? ${satisfied ? "Yes" : "No"}. (Threshold n0 = ${n0}${isN0OrAbove ? ", current n >= n0" : ", current n < n0"}).`,
      focus: []
    });
  }

  states[states.length - 1].complete = true;
  return { initial: states[0], states, events };
});

export const bigOmegaEngine = engine<ComplexityScenario, ComplexitySnapshot>((input) => {
  const f_n = input.f_n || "n^2";
  const g_n = input.g_n || "n";
  const c = input.c ?? 1;
  const n0 = input.n0 ?? 2;

  const states: ComplexitySnapshot[] = [];
  const events: SimulationEvent[] = [];

  const initial: ComplexitySnapshot = {
    f_n,
    g_n,
    c,
    n0,
    currentN: null,
    f_val: null,
    g_val: null,
    relationshipSatisfied: null,
    complete: false
  };
  states.push(initial);

  const startN = Math.max(1, n0 - 2);
  const endN = n0 + 2;

  for (let n = startN; n <= endN; n++) {
    const f_val = evaluateComplexity(f_n, n);
    const g_val = evaluateComplexity(g_n, n);
    const rhs = c * g_val;
    const satisfied = f_val >= rhs;
    const isN0OrAbove = n >= n0;

    states.push({
      f_n,
      g_n,
      c,
      n0,
      currentN: n,
      f_val,
      g_val: rhs,
      relationshipSatisfied: satisfied,
      complete: n === endN
    });

    events.push({
      kind: satisfied ? "relax" : "compare",
      codeLine: 4,
      message: `Testing n = ${n}: f(n) = ${f_val} >= c * g(n) = ${rhs}? ${satisfied ? "Yes" : "No"}. (Threshold n0 = ${n0}${isN0OrAbove ? ", current n >= n0" : ", current n < n0"}).`,
      focus: []
    });
  }

  states[states.length - 1].complete = true;
  return { initial: states[0], states, events };
});

export const bigThetaEngine = engine<ComplexityScenario, ComplexitySnapshot>((input) => {
  const f_n = input.f_n || "2*n";
  const g_n = input.g_n || "n";
  const c = input.c ?? 3; // treat c as c2, c1 as c / 3
  const n0 = input.n0 ?? 2;

  const states: ComplexitySnapshot[] = [];
  const events: SimulationEvent[] = [];

  const initial: ComplexitySnapshot = {
    f_n,
    g_n,
    c,
    n0,
    currentN: null,
    f_val: null,
    g_val: null,
    relationshipSatisfied: null,
    complete: false
  };
  states.push(initial);

  const startN = Math.max(1, n0 - 2);
  const endN = n0 + 2;

  for (let n = startN; n <= endN; n++) {
    const f_val = evaluateComplexity(f_n, n);
    const g_val = evaluateComplexity(g_n, n);
    const c1 = Math.max(0.1, c / 4);
    const c2 = c;
    const lower = c1 * g_val;
    const upper = c2 * g_val;
    const satisfied = f_val >= lower && f_val <= upper;
    const isN0OrAbove = n >= n0;

    states.push({
      f_n,
      g_n,
      c,
      n0,
      currentN: n,
      f_val,
      g_val: g_val,
      relationshipSatisfied: satisfied,
      complete: n === endN
    });

    events.push({
      kind: satisfied ? "relax" : "compare",
      codeLine: 5,
      message: `Testing n = ${n}: ${lower.toFixed(1)} <= f(n) = ${f_val} <= ${upper.toFixed(1)}? ${satisfied ? "Yes" : "No"}. (Threshold n0 = ${n0}${isN0OrAbove ? ", current n >= n0" : ", current n < n0"}).`,
      focus: []
    });
  }

  states[states.length - 1].complete = true;
  return { initial: states[0], states, events };
});
