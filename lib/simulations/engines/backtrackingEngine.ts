import { engine } from "../../engines";
import type { BacktrackingScenario, SimulationEvent } from "../../types";

export type BacktrackingSnapshot = {
  problem: "n-queens" | "maze" | "subset-sum";
  size: number;
  board?: number[][];
  path?: [number, number][];
  currentSelection?: number[];
  success: boolean;
  complete: boolean;
};

export const backtrackingEngine = engine<BacktrackingScenario, BacktrackingSnapshot>((input) => {
  const problem = input.problem || "n-queens";
  const size = input.size ?? 4;

  const states: BacktrackingSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (board: number[][], success: boolean, complete: boolean, event: SimulationEvent) => {
    states.push({
      problem,
      size,
      board: board.map(row => [...row]),
      success,
      complete
    });
    events.push(event);
  };

  if (problem === "n-queens") {
    const board = Array.from({ length: size }, () => Array(size).fill(0));
    const isSafe = (b: number[][], row: number, col: number) => {
      for (let i = 0; i < row; i++) {
        if (b[i][col] === 1) return false;
      }
      for (let i = row - 1, j = col - 1; i >= 0 && j >= 0; i--, j--) {
        if (b[i][j] === 1) return false;
      }
      for (let i = row - 1, j = col + 1; i >= 0 && j < size; i--, j++) {
        if (b[i][j] === 1) return false;
      }
      return true;
    };

    let steps = 0;
    const maxSteps = 50;

    const solve = (row: number): boolean => {
      if (row === size) {
        pushState(board, true, true, {
          kind: "complete",
          codeLine: 4,
          message: "All queens placed safely! Solution found."
        });
        return true;
      }

      if (steps > maxSteps) return false;

      for (let col = 0; col < size; col++) {
        steps++;
        board[row][col] = 1;
        pushState(board, false, false, {
          kind: "compare",
          codeLine: 1,
          message: `Testing placement of Queen in Row ${row}, Col ${col}.`
        });

        if (isSafe(board, row, col)) {
          pushState(board, false, false, {
            kind: "visit",
            codeLine: 2,
            message: `Placement safe. Moving to Row ${row + 1}.`
          });
          if (solve(row + 1)) return true;
        }

        board[row][col] = 0;
        pushState(board, false, false, {
          kind: "shift",
          codeLine: 3,
          message: `Conflict or dead end! Backtracking: remove Queen from Row ${row}, Col ${col}.`
        });
      }
      return false;
    };

    const initialBoard = board.map(row => [...row]);
    pushState(initialBoard, false, false, {
      kind: "visit",
      codeLine: 0,
      message: `Initialized ${size}-Queens board. Starting backtrack search.`
    });

    const solved = solve(0);
    if (!solved) {
      pushState(board, false, true, {
        kind: "complete",
        codeLine: 5,
        message: "No solution found or search limit reached."
      });
    }

  } else {
    states.push({ problem, size, success: true, complete: true });
    events.push({ kind: "complete", codeLine: 1, message: "Backtracking complete." });
  }

  return { initial: states[0], states, events };
});
