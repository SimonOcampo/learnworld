"use client";

import type { BitwiseSnapshot } from "@/lib/engines";

export function BitwiseLab({ snapshot }: { snapshot: BitwiseSnapshot }) {
  const { operandA, operandB, binaryA, binaryB, binaryResult, result, currentBitIndex } = snapshot;

  const bitsCount = binaryA.length;

  const renderBitRow = (binaryStr: string, label: string, decimalVal: number | null) => {
    return (
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink/10 pb-3">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase text-ink/50">{label}</span>
          <span className="font-mono text-sm font-black text-ink">{decimalVal !== null ? decimalVal : "—"}</span>
        </div>

        <div className="flex gap-1.5">
          {binaryStr.split("").map((bit, idx) => {
            // Check if this bit corresponds to currentBitIndex (which is bitsCount - 1 - idx)
            const isCurrent = currentBitIndex !== null && (bitsCount - 1 - idx) === currentBitIndex;
            return (
              <div
                key={idx}
                className={`flex h-10 w-9 items-center justify-center rounded-lg border-2 font-mono text-base font-black shadow-sm transition-all ${
                  isCurrent
                    ? "border-ink bg-orange text-white"
                    : bit === "_"
                    ? "border-dashed border-ink/20 bg-white/20 text-ink/30"
                    : "border-ink bg-white text-ink"
                }`}
              >
                {bit}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex min-h-[390px] flex-col justify-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="mx-auto w-full max-w-lg rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#13211b] space-y-4">
        <h3 className="display text-lg font-black uppercase text-ink">Bitwise Register</h3>

        {renderBitRow(binaryA, "Operand A", operandA)}

        {binaryB !== null && renderBitRow(binaryB, "Operand B", operandB)}

        {renderBitRow(binaryResult, "Result", result)}

        {currentBitIndex !== null && (
          <p className="text-center font-mono text-[10px] font-black uppercase text-orange">
            Evaluating bit position {currentBitIndex} (2^{currentBitIndex})
          </p>
        )}
      </div>
    </div>
  );
}
