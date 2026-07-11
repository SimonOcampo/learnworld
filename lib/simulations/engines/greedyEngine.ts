import { engine } from "../../engines";
import type { GreedyScenario, SimulationEvent } from "../../types";

export type GreedySnapshot = {
  problem: "knapsack" | "activity-selection" | "huffman";
  items: { id: string; weight: number; value: number; start?: number; end?: number; ratio?: number }[];
  selectedIds: string[];
  currentWeight: number;
  currentValue: number;
  capacity: number;
  complete: boolean;
};

export const greedyEngine = engine<GreedyScenario, GreedySnapshot>((input) => {
  const problem = input.problem || "knapsack";
  const rawItems = input.items || [];
  const capacity = input.capacity ?? 10;

  const states: GreedySnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (
    processedItems: GreedySnapshot["items"],
    selected: string[],
    weight: number,
    val: number,
    complete: boolean,
    event: SimulationEvent
  ) => {
    states.push({
      problem,
      items: processedItems.map(item => ({ ...item })),
      selectedIds: [...selected],
      currentWeight: weight,
      currentValue: val,
      capacity,
      complete
    });
    events.push(event);
  };

  if (problem === "knapsack") {
    const items = rawItems.map(item => ({
      ...item,
      ratio: Number((item.value / item.weight).toFixed(2))
    }));

    items.sort((a, b) => b.ratio! - a.ratio!);

    pushState(items, [], 0, 0, false, {
      kind: "visit",
      codeLine: 1,
      message: "Fractional Knapsack: Sorted items by value/weight ratio descending.",
      focus: []
    });

    let currentWeight = 0;
    let currentValue = 0;
    const selected: string[] = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const remaining = capacity - currentWeight;

      if (remaining <= 0) break;

      if (item.weight <= remaining) {
        currentWeight += item.weight;
        currentValue += item.value;
        selected.push(item.id);

        pushState(items, selected, currentWeight, currentValue, false, {
          kind: "place",
          codeLine: 2,
          message: `Greedy choice: fully take item '${item.id}' (weight = ${item.weight}, value = ${item.value}). Remaining capacity = ${capacity - currentWeight}.`,
          focus: [item.id]
        });
      } else {
        const fraction = remaining / item.weight;
        const takenValue = fraction * item.value;
        currentWeight += remaining;
        currentValue += Number(takenValue.toFixed(2));
        selected.push(`${item.id} (${(fraction * 100).toFixed(0)}%)`);

        pushState(items, selected, currentWeight, currentValue, false, {
          kind: "place",
          codeLine: 3,
          message: `Greedy choice: take fraction ${fraction.toFixed(2)} of item '${item.id}' (added weight = ${remaining}, value = ${takenValue.toFixed(2)}). Knapsack full.`,
          focus: [item.id]
        });
        break;
      }
    }

    pushState(items, selected, currentWeight, currentValue, true, {
      kind: "complete",
      codeLine: 4,
      message: `Knapsack filled! Total value = ${currentValue}, total weight = ${currentWeight}.`,
      focus: []
    });

  } else if (problem === "activity-selection") {
    const items = rawItems.map(item => ({
      ...item,
      start: item.start ?? 0,
      end: item.end ?? 0
    }));

    items.sort((a, b) => a.end! - b.end!);

    pushState(items, [], 0, 0, false, {
      kind: "visit",
      codeLine: 1,
      message: "Activity Selection: Sorted activities by end time ascending.",
      focus: []
    });

    const selected: string[] = [];
    let lastEnd = 0;

    for (const act of items) {
      pushState(items, selected, 0, 0, false, {
        kind: "compare",
        codeLine: 2,
        message: `Evaluate activity '${act.id}': interval [${act.start}, ${act.end}]. Does it overlap with last selected end time ${lastEnd}?`,
        focus: [act.id]
      });

      if (act.start! >= lastEnd) {
        selected.push(act.id);
        lastEnd = act.end!;
        pushState(items, selected, 0, 0, false, {
          kind: "place",
          codeLine: 3,
          message: `Select activity '${act.id}'. New last selected end time = ${lastEnd}.`,
          focus: [act.id]
        });
      }
    }

    pushState(items, selected, 0, 0, true, {
      kind: "complete",
      codeLine: 4,
      message: `Activity Selection complete. Selected activities: [${selected.join(", ")}].`,
      focus: []
    });

  } else {
    states.push({ problem, items: rawItems, selectedIds: [], currentWeight: 0, currentValue: 0, capacity, complete: true });
    events.push({ kind: "complete", codeLine: 1, message: "Greedy algorithm complete." });
  }

  return { initial: states[0], states, events };
});
