import { engine } from "../../engines";
import type { BitwiseScenario, SimulationEvent } from "../../types";

export type BitwiseSnapshot = {
  operandA: number;
  operandB: number | null;
  binaryA: string;
  binaryB: string | null;
  binaryResult: string;
  result: number | null;
  currentBitIndex: number | null;
  complete: boolean;
};

export const bitwiseEngine = engine<BitwiseScenario, BitwiseSnapshot>((input) => {
  const operandA = input.operandA;
  const operandB = input.operandB ?? null;
  const operator = input.operator;
  const bits = input.bits || 8;

  const toBinary = (num: number) => {
    const mask = (1 << bits) - 1;
    const val = num & mask;
    return val.toString(2).padStart(bits, "0");
  };

  const binA = toBinary(operandA);
  const binB = operandB !== null ? toBinary(operandB) : null;

  const states: BitwiseSnapshot[] = [];
  const events: SimulationEvent[] = [];

  const pushState = (
    resBin: string,
    currentBit: number | null,
    complete: boolean,
    event: SimulationEvent
  ) => {
    let resNum = 0;
    if (resBin.length === bits) {
      resNum = parseInt(resBin, 2);
    }
    states.push({
      operandA,
      operandB,
      binaryA: binA,
      binaryB: binB,
      binaryResult: resBin.padEnd(bits, "_"),
      result: resBin.length === bits ? resNum : null,
      currentBitIndex: currentBit,
      complete
    });
    events.push(event);
  };

  const initialSnapshot: BitwiseSnapshot = {
    operandA,
    operandB,
    binaryA: binA,
    binaryB: binB,
    binaryResult: "_".repeat(bits),
    result: null,
    currentBitIndex: null,
    complete: false
  };
  states.push(initialSnapshot);

  let currentResultBin = "";

  for (let i = 0; i < bits; i++) {
    const bitA = parseInt(binA[i]);
    const bitB = binB ? parseInt(binB[i]) : 0;
    let resBit = 0;

    if (operator === "AND") {
      resBit = bitA & bitB;
    } else if (operator === "OR") {
      resBit = bitA | bitB;
    } else if (operator === "XOR") {
      resBit = bitA ^ bitB;
    } else if (operator === "NOT") {
      resBit = bitA === 0 ? 1 : 0;
    } else if (operator === "SHL") {
      const shiftAmt = operandB ?? 1;
      const targetIndex = i + shiftAmt;
      resBit = targetIndex < bits ? parseInt(binA[targetIndex]) : 0;
    } else if (operator === "SHR") {
      const shiftAmt = operandB ?? 1;
      const targetIndex = i - shiftAmt;
      resBit = targetIndex >= 0 ? parseInt(binA[targetIndex]) : 0;
    }

    currentResultBin += resBit.toString();

    pushState(
      currentResultBin,
      bits - 1 - i,
      i === bits - 1,
      {
        kind: "place",
        codeLine: 2,
        message: `Bit position ${bits - 1 - i}: A[bit] = ${bitA}${binB !== null ? `, B[bit] = ${bitB}` : ""}. Result bit = ${resBit}.`,
        focus: []
      }
    );
  }

  states[states.length - 1].complete = true;
  return { initial: states[0], states, events };
});
