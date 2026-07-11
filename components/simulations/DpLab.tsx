"use client";

import type { DPSnapshot } from "@/lib/engines";

export function DpLab({ snapshot }: { snapshot: DPSnapshot }) {
  const { grid, rowLabels, colLabels, currentRow, currentCol } = snapshot;

  return (
    <div className="flex min-h-[390px] flex-col justify-center items-center overflow-x-auto rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="mx-auto rounded-2xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#13211b] min-w-max">
        <h3 className="display mb-4 text-sm font-black uppercase text-ink">Dynamic Programming Grid</h3>

        <div className="grid gap-1">
          {/* Header Row */}
          <div className="flex gap-1 items-center">
            {/* Corner label */}
            <div className="flex h-10 w-10 items-center justify-center font-mono text-xs font-bold text-ink/30">
              \
            </div>
            {colLabels.map((cLabel, cIdx) => (
              <div
                key={`col-${cIdx}`}
                className="flex h-10 w-12 items-center justify-center font-mono text-xs font-black text-ink/50"
              >
                {cLabel}
                <span className="block text-[8px] font-bold text-ink/30 absolute mt-5">{cIdx}</span>
              </div>
            ))}
          </div>

          {/* Grid Rows */}
          {grid.map((row, rIdx) => (
            <div key={`row-${rIdx}`} className="flex gap-1 items-center">
              {/* Row Label */}
              <div className="flex h-10 w-10 items-center justify-center font-mono text-xs font-black text-ink/50">
                {rowLabels[rIdx]}
                <span className="block text-[8px] font-bold text-ink/30 absolute ml-6">{rIdx}</span>
              </div>

              {/* Row Cells */}
              {row.map((val, cIdx) => {
                const isCurrent = currentRow === rIdx && currentCol === cIdx;
                
                // Dependency highlighting for LCS:
                // If evaluating (currentRow, currentCol), it depends on:
                // - diagonal: (currentRow-1, currentCol-1)
                // - top: (currentRow-1, currentCol)
                // - left: (currentRow, currentCol-1)
                const isDependency =
                  currentRow !== null &&
                  currentCol !== null &&
                  ((rIdx === currentRow - 1 && cIdx === currentCol - 1) ||
                    (rIdx === currentRow - 1 && cIdx === currentCol) ||
                    (rIdx === currentRow && cIdx === currentCol - 1));

                return (
                  <div
                    key={`cell-${rIdx}-${cIdx}`}
                    className={`flex h-10 w-12 items-center justify-center rounded-lg border-2 font-mono text-base font-black shadow-sm transition-all ${
                      isCurrent
                        ? "border-ink bg-orange text-white shadow-[2px_2px_0_#13211b] -translate-y-0.5"
                        : isDependency
                        ? "border-forest bg-lime/40 text-forest"
                        : "border-ink/10 bg-white text-ink"
                    }`}
                  >
                    {val}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
