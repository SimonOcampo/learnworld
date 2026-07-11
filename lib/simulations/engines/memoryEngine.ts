import { engine } from "../../engines";
import type { MemoryScenario, SimulationRun, SimulationEvent } from "../../types";

export type MemorySnapshot = {
  variables: { name: string; type: string; value: string; address: string }[];
  heapAllocations: { address: string; size: number; value: string; label?: string }[];
  currentStatementIndex: number | null;
  complete: boolean;
};

function runMemorySimulation(input: MemoryScenario): SimulationRun<MemorySnapshot> {
  const variables = input.variables.map(v => ({ ...v }));
  const heapAllocations = input.heapAllocations.map(h => ({ ...h }));
  const statements = input.statements || [];

  const initial: MemorySnapshot = {
    variables: variables.map(v => ({ ...v })),
    heapAllocations: heapAllocations.map(h => ({ ...h })),
    currentStatementIndex: null,
    complete: false
  };

  const states: MemorySnapshot[] = [{ ...initial }];
  const events: SimulationEvent[] = [];

  const currentVariables = variables.map(v => ({ ...v }));
  const currentHeap = heapAllocations.map(h => ({ ...h }));

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const { message, kind } = executeStatement(stmt, currentVariables, currentHeap);

    const state: MemorySnapshot = {
      variables: currentVariables.map(v => ({ ...v })),
      heapAllocations: currentHeap.map(h => ({ ...h })),
      currentStatementIndex: i,
      complete: i === statements.length - 1
    };

    events.push({
      kind,
      codeLine: i + 1,
      message,
      focus: []
    });
    states.push(state);
  }

  // End event if not already complete or empty
  if (statements.length === 0) {
    initial.complete = true;
  } else {
    states[states.length - 1].complete = true;
  }

  return { initial: states[0], states, events };
}

function executeStatement(
  statement: string,
  variables: MemorySnapshot["variables"],
  heapAllocations: MemorySnapshot["heapAllocations"]
): { message: string; kind: "place" | "shift" | "relax" } {
  const stmt = statement.trim().replace(/;$/, "");

  // 1. free(p) or delete p
  const freeMatch = stmt.match(/^(?:free|delete)\s*\(?(\*?\w+)\)?$/);
  if (freeMatch) {
    const varName = freeMatch[1];
    const variable = variables.find(v => v.name === varName);
    if (variable) {
      const addr = variable.value;
      const allocIndex = heapAllocations.findIndex(h => h.address === addr);
      if (allocIndex !== -1) {
        heapAllocations.splice(allocIndex, 1);
        return { message: `Freed heap memory at ${addr} referenced by pointer '${varName}'.`, kind: "shift" };
      } else {
        return { message: `Warning: Attempted to free invalid/already-freed address '${addr}' via '${varName}'.`, kind: "shift" };
      }
    }
  }

  // 2. Assignments: lhs = rhs
  const assignMatch = stmt.match(/^([*\w\->.]+)\s*=\s*(.+)$/);
  if (assignMatch) {
    const lhs = assignMatch[1].trim();
    const rhs = assignMatch[2].trim();

    let rhsVal = rhs;

    if (rhs.startsWith("&")) {
      const targetName = rhs.slice(1).trim();
      const targetVar = variables.find(v => v.name === targetName);
      if (targetVar) {
        rhsVal = targetVar.address;
      }
    } else if (rhs.startsWith("malloc") || rhs.startsWith("new")) {
      const addr = "0x" + (0x5000 + heapAllocations.length * 16).toString(16).toUpperCase();
      heapAllocations.push({
        address: addr,
        size: 4,
        value: "0",
        label: rhs
      });
      rhsVal = addr;
    } else {
      const targetVar = variables.find(v => v.name === rhs);
      if (targetVar) {
        rhsVal = targetVar.value;
      }
    }

    if (lhs.startsWith("*")) {
      const ptrName = lhs.slice(1).trim();
      const ptrVar = variables.find(v => v.name === ptrName);
      if (ptrVar) {
        const addr = ptrVar.value;
        const targetVar = variables.find(v => v.address === addr);
        if (targetVar) {
          targetVar.value = rhsVal;
          return { message: `Dereferenced '${ptrName}' to update variable '${targetVar.name}' to ${rhsVal}.`, kind: "place" };
        }
        const targetHeap = heapAllocations.find(h => h.address === addr);
        if (targetHeap) {
          targetHeap.value = rhsVal;
          return { message: `Dereferenced '${ptrName}' to update heap memory at ${addr} to ${rhsVal}.`, kind: "place" };
        }
        return { message: `Warning: Dangling pointer dereference of '${ptrName}' at address '${addr}'.`, kind: "place" };
      }
    } else if (lhs.includes("->")) {
      const [ptrName, field] = lhs.split("->").map(s => s.trim());
      const ptrVar = variables.find(v => v.name === ptrName);
      if (ptrVar) {
        const addr = ptrVar.value;
        const parentVar = variables.find(v => v.address === addr);
        if (parentVar) {
          let structName = parentVar.name;
          if (structName.includes(".")) {
            structName = structName.split(".")[0];
          }
          const fieldVarName = `${structName}.${field}`;
          const fieldVar = variables.find(v => v.name === fieldVarName);
          if (fieldVar) {
            fieldVar.value = rhsVal;
            return { message: `Assigned ${rhsVal} to field '${field}' of structure at '${ptrName}->'.`, kind: "place" };
          }
        }
      }
    } else if (lhs.includes(".")) {
      const fieldVar = variables.find(v => v.name === lhs);
      if (fieldVar) {
        fieldVar.value = rhsVal;
        return { message: `Assigned ${rhsVal} to structure field '${lhs}'.`, kind: "place" };
      }
    } else {
      const lhsVar = variables.find(v => v.name === lhs);
      if (lhsVar) {
        lhsVar.value = rhsVal;
        return { message: `Assigned ${rhsVal} to variable '${lhs}'.`, kind: "place" };
      }
    }
  }

  return { message: `Executed statement: ${statement}`, kind: "place" };
}

/** Unified memory engine — handles pointers, structures, and dynamic memory allocation.
 *  All three concepts share the exact same simulation logic. */
export const memoryEngine = engine<MemoryScenario, MemorySnapshot>((input) => runMemorySimulation(input));

// Legacy aliases for backward compatibility with imports
export const pointersEngine = memoryEngine;
export const structuresEngine = memoryEngine;
export const dynamicMemoryEngine = memoryEngine;
