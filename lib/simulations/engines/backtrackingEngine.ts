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

  } else if (problem === "maze") {
    const maze = input.mazeGrid?.map(row => [...row]) ?? [[0, 0, 1], [1, 0, 1], [0, 0, 0]];
    const n = maze.length;
    const path: [number, number][] = [];
    const visited = Array.from({ length: n }, () => Array(n).fill(false));
    const push = (row: number, col: number, complete: boolean, success: boolean, event: SimulationEvent) => {
      states.push({ problem, size: n, board: maze.map(line => [...line]), path: [...path], currentSelection: [row, col], success, complete });
      events.push(event);
    };
    const solve = (row: number, col: number): boolean => {
      if (row < 0 || col < 0 || row >= n || col >= n || maze[row][col] === 1 || visited[row][col]) return false;
      visited[row][col] = true;
      path.push([row, col]);
      push(row, col, false, false, { kind: "visit", codeLine: 1, message: `Visit maze cell (${row}, ${col}).`, focus: [] });
      if (row === n - 1 && col === n - 1) return true;
      for (const [nextRow, nextCol] of [[row, col + 1], [row + 1, col], [row, col - 1], [row - 1, col]]) if (solve(nextRow, nextCol)) return true;
      path.pop();
      push(row, col, false, false, { kind: "shift", codeLine: 2, message: `Dead end at (${row}, ${col}); backtrack.`, focus: [] });
      return false;
    };
    const solved = solve(0, 0);
    push(n - 1, n - 1, true, solved, { kind: "complete", codeLine: 3, message: solved ? "Maze path found." : "No maze path exists.", focus: [] });
  } else {
    const values = input.values ?? [];
    const target = input.targetSum ?? 0;
    const selected: number[] = [];
    const push = (index: number, sum: number, complete: boolean, success: boolean, event: SimulationEvent) => {
      states.push({ problem, size: values.length, currentSelection: [...selected], success, complete });
      events.push({ ...event, message: `${event.message} (index ${index}, sum ${sum})` });
    };
    const solve = (index: number, sum: number): boolean => {
      push(index, sum, false, false, { kind: "compare", codeLine: 1, message: "Consider the next subset value", focus: [] });
      if (sum === target) return true;
      if (index === values.length || sum > target) return false;
      selected.push(values[index]);
      if (solve(index + 1, sum + values[index])) return true;
      selected.pop();
      push(index, sum, false, false, { kind: "shift", codeLine: 2, message: `Exclude ${values[index]} and backtrack`, focus: [] });
      return solve(index + 1, sum);
    };
    const solved = solve(0, 0);
    push(values.length, selected.reduce((sum, value) => sum + value, 0), true, solved, { kind: "complete", codeLine: 3, message: solved ? `Subset reaches ${target}.` : `No subset reaches ${target}.`, focus: [] });
  }

  return { initial: states[0], states, events };
});
