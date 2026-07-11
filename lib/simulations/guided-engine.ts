export type GuidedState = { step: number; revealed: string[]; complete: boolean };
export type GuidedEvent = { title: string; message: string; prompt: string };

const familyEvents: Record<string, GuidedEvent[]> = {
  memory: [
    { title: "Name the storage", message: "Separate values, addresses, and ownership before following an operation.", prompt: "Which entity owns or points to the active storage?" },
    { title: "Apply one operation", message: "Update only the field, address, allocation, or bit named by the rule.", prompt: "What changes, and what must remain unchanged?" },
    { title: "Check lifetime", message: "Verify that every reference still targets valid storage and every allocation has an owner.", prompt: "Is any reference invalid, leaked, or aliased?" },
  ],
  sequence: [
    { title: "Mark the active index", message: "Identify the valid range and the element currently being read or written.", prompt: "Which index is active?" },
    { title: "Apply the update", message: "Perform the declared comparison, read, or write without changing unrelated elements.", prompt: "Which single value changes next?" },
    { title: "Verify the boundary", message: "Check the resulting sequence and its stopping condition.", prompt: "Has traversal reached its boundary?" },
  ],
  "call-stack": [
    { title: "Push a frame", message: "Record the function parameters and the return location for this call.", prompt: "What arguments belong in the new frame?" },
    { title: "Test the base case", message: "Evaluate the stopping rule before making another recursive call.", prompt: "Does this frame stop or recurse?" },
    { title: "Return upward", message: "Resolve the newest frame first and pass its result to its caller.", prompt: "Which frame returns next?" },
  ],
  "linear-adt": [
    { title: "Choose an endpoint", message: "Identify where this structure permits insertion and removal.", prompt: "Which endpoint does the operation use?" },
    { title: "Apply the operation", message: "Update the stack top or queue front/rear according to its invariant.", prompt: "Which item leaves or becomes active?" },
    { title: "Check ordering", message: "Read the remaining items in the structure's defined order.", prompt: "Does the result preserve LIFO or FIFO order?" },
  ],
  linked: [
    { title: "Locate neighboring links", message: "Record the predecessor, current node, and successor before mutation.", prompt: "Which links protect the rest of the structure?" },
    { title: "Rewire one link", message: "Change links in an order that keeps reachable nodes connected.", prompt: "Which reference must change first?" },
    { title: "Verify reachability", message: "Traverse from the head and ensure there are no unintended cycles or lost nodes.", prompt: "Can every expected node still be reached?" },
  ],
  tree: [
    { title: "Read the local shape", message: "Identify the root, children, and ordering rule around the active node.", prompt: "Which subtree can contain the target?" },
    { title: "Apply the tree rule", message: "Visit or update the next node selected by the traversal or search invariant.", prompt: "Which node becomes active next?" },
    { title: "Validate the result", message: "Check ordering, reachability, and the requested traversal result.", prompt: "Which invariant proves this state is valid?" },
  ],
  complexity: [
    { title: "Choose the input measure", message: "Define n and the operation being counted before comparing functions.", prompt: "What does n represent here?" },
    { title: "Compare dominant growth", message: "Ignore constant factors only after identifying the dominant term.", prompt: "Which term dominates as n grows?" },
    { title: "State the bound", message: "Match the claim to upper, lower, or tight-bound evidence.", prompt: "Is the evidence O, Ω, or Θ?" },
  ],
  bitwise: [
    { title: "Write fixed-width bits", message: "Align operands to the same width before applying the operator.", prompt: "Which bit positions are active?" },
    { title: "Apply per-bit rules", message: "Evaluate AND, OR, XOR, NOT, or a shift independently at each position.", prompt: "What is the next result bit?" },
    { title: "Interpret the value", message: "Convert the result using the declared signedness and width.", prompt: "What value do these bits represent?" },
  ],
};

const generic: GuidedEvent[] = [
  { title: "Identify the state", message: "Name the entities, variables, and rule that control this step.", prompt: "What information determines the next action?" },
  { title: "Predict the action", message: "Choose the next action allowed by the concept's invariant.", prompt: "What should change next?" },
  { title: "Verify the invariant", message: "Check the new state against the objective and all declared rules.", prompt: "Why is the resulting state valid?" },
];

export function guidedEvents(family: string) { return familyEvents[family] ?? generic; }
export function initialGuidedState(): GuidedState { return { step: 0, revealed: [], complete: false }; }
export function advanceGuided(state: GuidedState, events: GuidedEvent[]): GuidedState {
  if (state.complete) return state;
  const next = Math.min(state.step + 1, events.length);
  return { step: next, revealed: events.slice(0, next).map((event) => event.title), complete: next >= events.length };
}
