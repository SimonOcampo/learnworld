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

  } else {
    states.push({ problem, grid: [[0]], rowLabels: ["-"], colLabels: ["-"], currentRow: null, currentCol: null, complete: true });
    events.push({ kind: "complete", codeLine: 1, message: "DP table complete." });
  }

  return { initial: states[0], states, events };
});
