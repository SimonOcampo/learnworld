import { engine } from "../../engines";
import type { DPScenario, SimulationEvent } from "../../types";

export type DPSnapshot = {
  problem: "knapsack" | "lcs" | "edit-distance";
  grid: number[][];
  rowLabels: string[];
  colLabels: string[];
  currentRow: number | null;
  currentCol: number | null;
  complete: boolean;
};

export const dpEngine = engine<DPScenario, DPSnapshot>((input) => {
  const problem = input.problem || "lcs";
  const stringA = input.stringA || "BAT";
  const stringB = input.stringB || "CAT";

  const states: DPSnapshot[] = [];
  const events: SimulationEvent[] = [];

  if (problem === "lcs") {
    const rows = stringA.length + 1;
    const cols = stringB.length + 1;
    const grid = Array.from({ length: rows }, () => Array(cols).fill(0));

    const rowLabels = ["-", ...stringA.split("")];
    const colLabels = ["-", ...stringB.split("")];

    const pushState = (
      currR: number | null,
      currC: number | null,
      complete: boolean,
      event: SimulationEvent
    ) => {
      states.push({
        problem,
        grid: grid.map(row => [...row]),
        rowLabels,
        colLabels,
        currentRow: currR,
        currentCol: currC,
        complete
      });
      events.push(event);
    };

    pushState(null, null, false, {
      kind: "visit",
      codeLine: 1,
      message: `Initialized DP grid of size ${rows}x${cols} for LCS of '${stringA}' and '${stringB}'.`,
      focus: []
    });

    for (let r = 1; r < rows; r++) {
      for (let c = 1; c < cols; c++) {
        const charA = stringA[r - 1];
        const charB = stringB[c - 1];

        if (charA === charB) {
          grid[r][c] = grid[r - 1][c - 1] + 1;
          pushState(r, c, false, {
            kind: "place",
            codeLine: 2,
            message: `Match: '${charA}' === '${charB}'. Cell [${r},${c}] = diagonal + 1 = ${grid[r][c]}.`,
            focus: []
          });
        } else {
          grid[r][c] = Math.max(grid[r - 1][c], grid[r][c - 1]);
          pushState(r, c, false, {
            kind: "place",
            codeLine: 3,
            message: `Mismatch: '${charA}' !== '${charB}'. Cell [${r},${c}] = max(top, left) = ${grid[r][c]}.`,
            focus: []
          });
        }
      }
    }

    pushState(null, null, true, {
      kind: "complete",
      codeLine: 4,
      message: `LCS DP Table filled. Longest common subsequence length is ${grid[rows - 1][cols - 1]}.`,
      focus: []
    });

  } else if (problem === "edit-distance") {
    const rows = stringA.length + 1;
    const cols = stringB.length + 1;
    const grid = Array.from({ length: rows }, (_, row) => Array.from({ length: cols }, (_, col) => row === 0 ? col : col === 0 ? row : 0));
    const rowLabels = ["-", ...stringA.split("")];
    const colLabels = ["-", ...stringB.split("")];
    const push = (row: number | null, col: number | null, complete: boolean, event: SimulationEvent) => {
      states.push({ problem, grid: grid.map(line => [...line]), rowLabels, colLabels, currentRow: row, currentCol: col, complete });
      events.push(event);
    };
    push(null, null, false, { kind: "visit", codeLine: 1, message: `Initialize edit-distance grid for '${stringA}' and '${stringB}'.`, focus: [] });
    for (let row = 1; row < rows; row++) for (let col = 1; col < cols; col++) {
      const same = stringA[row - 1] === stringB[col - 1];
      grid[row][col] = same ? grid[row - 1][col - 1] : 1 + Math.min(grid[row - 1][col], grid[row][col - 1], grid[row - 1][col - 1]);
      push(row, col, false, { kind: "place", codeLine: same ? 2 : 3, message: same ? `Characters match; copy diagonal value ${grid[row][col]}.` : `Insert, delete, or replace: cell value is ${grid[row][col]}.`, focus: [] });
    }
    push(null, null, true, { kind: "complete", codeLine: 4, message: `Edit distance is ${grid[rows - 1][cols - 1]}.`, focus: [] });
  } else {
    const items = input.items ?? [];
    const capacity = input.capacity ?? 0;
    const grid = Array.from({ length: items.length + 1 }, () => Array(capacity + 1).fill(0));
    const rowLabels = ["-", ...items.map((_, index) => `i${index + 1}`)];
    const colLabels = Array.from({ length: capacity + 1 }, (_, index) => String(index));
    const push = (row: number | null, col: number | null, complete: boolean, event: SimulationEvent) => {
      states.push({ problem, grid: grid.map(line => [...line]), rowLabels, colLabels, currentRow: row, currentCol: col, complete });
      events.push(event);
    };
    push(null, null, false, { kind: "visit", codeLine: 1, message: `Initialize 0/1 knapsack table with capacity ${capacity}.`, focus: [] });
    for (let row = 1; row <= items.length; row++) for (let col = 0; col <= capacity; col++) {
      const item = items[row - 1];
      grid[row][col] = item.weight > col ? grid[row - 1][col] : Math.max(grid[row - 1][col], item.value + grid[row - 1][col - item.weight]);
      push(row, col, false, { kind: "place", codeLine: 2, message: `Best value using first ${row} items at capacity ${col}: ${grid[row][col]}.`, focus: [] });
    }
    push(null, null, true, { kind: "complete", codeLine: 3, message: `Knapsack optimum is ${grid[items.length][capacity]}.`, focus: [] });
  }

  return { initial: states[0], states, events };
});
