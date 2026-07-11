import { engine } from "../../engines";
import type { BloomScenario, SimulationEvent } from "../../types";

export type BloomSnapshot = {
  size: number;
  hashes: number;
  bitset: number[];
  lastInserted?: string;
  lastQueried?: string;
  hashIndices: number[];
  queryResult: boolean | null;
  complete: boolean;
};

function getHashIndices(item: string, numHashes: number, size: number): number[] {
  const indices: number[] = [];
  let baseHash = 0;
  for (let i = 0; i < item.length; i++) {
    baseHash = (baseHash * 31 + item.charCodeAt(i)) % 100003;
  }
  for (let k = 0; k < numHashes; k++) {
    indices.push((baseHash + k * 17) % size);
  }
  return indices;
}

export const bloomFilterEngine = engine<BloomScenario, BloomSnapshot>((input) => {
  const size = input.size || 8;
  const hashes = input.hashes || 2;
  const insertions = input.insertions || ["apple"];
  const queries = input.queries || ["apple", "banana"];

  const bitset = Array(size).fill(0);
  const states: BloomSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (
    lastInserted: string | undefined,
    lastQueried: string | undefined,
    hashInds: number[],
    qRes: boolean | null,
    complete: boolean,
    event: SimulationEvent
  ) => {
    states.push({
      size,
      hashes,
      bitset: [...bitset],
      lastInserted,
      lastQueried,
      hashIndices: [...hashInds],
      queryResult: qRes,
      complete
    });
    events.push(event);
  };

  pushState(undefined, undefined, [], null, false, {
    kind: "visit",
    codeLine: 1,
    message: `Initialized Bloom filter of size ${size} with ${hashes} hash functions.`,
    focus: []
  });

  // Step 1: Process insertions
  for (const item of insertions) {
    const inds = getHashIndices(item, hashes, size);
    inds.forEach((idx) => {
      bitset[idx] = 1;
    });

    pushState(item, undefined, inds, null, false, {
      kind: "place",
      codeLine: 2,
      message: `Insert '${item}': Hashed to indices [${inds.join(", ")}]. Bits set to 1.`,
      focus: inds.map(String)
    });
  }

  // Step 2: Process queries
  for (const item of queries) {
    const inds = getHashIndices(item, hashes, size);
    const inFilter = inds.every((idx) => bitset[idx] === 1);

    pushState(undefined, item, inds, inFilter, false, {
      kind: "compare",
      codeLine: 3,
      message: `Query '${item}': Hashed to indices [${inds.join(", ")}]. Bits are: [${inds.map(idx => bitset[idx]).join(", ")}]. Result: ${inFilter ? "Probably in filter" : "Definitely not in filter"}.`,
      focus: inds.map(String)
    });
  }

  if (states.length > 1) {
    states[states.length - 1].complete = true;
  } else {
    states[0].complete = true;
  }

  return { initial: states[0], states, events };
});
