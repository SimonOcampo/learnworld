import { engine } from "../../engines";
import type { TrieScenario, SimulationEvent } from "../../types";

export type TrieNode = {
  id: string;
  char: string;
  isEndOfWord: boolean;
  children: Record<string, string>;
};

export type TrieSnapshot = {
  nodes: Record<string, TrieNode>;
  rootId: string;
  currentWord: string | null;
  currentNodeId: string | null;
  complete: boolean;
};

export const triesEngine = engine<TrieScenario, TrieSnapshot>((input) => {
  const words = input.words || ["cat", "car"];
  const searchPrefix = input.searchPrefix || "ca";

  const nodes: Record<string, TrieNode> = {
    root: { id: "root", char: "", isEndOfWord: false, children: {} }
  };

  let nodeCounter = 0;
  const getNextNodeId = () => `node_${nodeCounter++}`;

  const insertWordDirect = (word: string) => {
    let currId = "root";
    for (const char of word) {
      const currNode = nodes[currId];
      if (!currNode.children[char]) {
        const nextId = getNextNodeId();
        nodes[nextId] = { id: nextId, char, isEndOfWord: false, children: {} };
        currNode.children[char] = nextId;
      }
      currId = currNode.children[char];
    }
    nodes[currId].isEndOfWord = true;
  };

  words.forEach(insertWordDirect);

  const states: TrieSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (
    currWord: string | null,
    currNodeId: string | null,
    complete: boolean,
    event: SimulationEvent
  ) => {
    const nodesCopy: Record<string, TrieNode> = {};
    for (const key of Object.keys(nodes)) {
      nodesCopy[key] = { ...nodes[key], children: { ...nodes[key].children } };
    }
    states.push({
      nodes: nodesCopy,
      rootId: "root",
      currentWord: currWord,
      currentNodeId: currNodeId,
      complete
    });
    events.push(event);
  };

  pushState(null, "root", false, {
    kind: "visit",
    codeLine: 1,
    message: `Trie initialized. Ready to search prefix '${searchPrefix}'.`,
    focus: ["root"]
  });

  let currId = "root";
  let path = "";
  let matched = true;

  for (let i = 0; i < searchPrefix.length; i++) {
    const char = searchPrefix[i];
    const currNode = nodes[currId];
    const nextId = currNode.children[char];

    if (nextId) {
      currId = nextId;
      path += char;
      pushState(path, currId, false, {
        kind: "compare",
        codeLine: 2,
        message: `Match character '${char}' at node '${currId}'. Current path: '${path}'.`,
        focus: [currId]
      });
    } else {
      matched = false;
      pushState(path, currId, true, {
        kind: "complete",
        codeLine: 3,
        message: `Failed to match character '${char}'. Prefix '${searchPrefix}' not present.`,
        focus: [currId]
      });
      break;
    }
  }

  if (matched) {
    pushState(path, currId, true, {
      kind: "complete",
      codeLine: 4,
      message: `Prefix '${searchPrefix}' successfully matched.`,
      focus: [currId]
    });
  }

  return { initial: states[0], states, events };
});
