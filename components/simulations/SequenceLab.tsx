"use client";

import type { SequenceSnapshot } from "@/lib/engines";

export function SequenceLab({ snapshot }: { snapshot: SequenceSnapshot }) {
  const { elements, activeIndex, targetIndex, comparing } = snapshot;

  return (
    <div className="flex min-h-[390px] flex-col justify-center overflow-x-auto rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="mx-auto flex min-w-max items-end gap-2">
        {elements.map((value, index) => {
          const isActive = index === activeIndex;
          const isComparing = comparing.includes(index);
          const isTarget = index === targetIndex;
          const isNullTerminator = value === "\0" || value === "\\0";

          return (
            <div key={index} className="flex w-14 flex-col items-center gap-2">
              {/* Top pointer indicators */}
              <div className="h-6 flex flex-col justify-end">
                {isTarget && (
                  <span className="rounded bg-orange px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                    tgt
                  </span>
                )}
              </div>

              {/* Node value card */}
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-xl border-2 text-lg font-black shadow-sm transition-all ${
                  isComparing
                    ? "-translate-y-1 border-ink bg-orange text-white"
                    : isActive
                    ? "-translate-y-1 border-forest bg-lime text-ink"
                    : isNullTerminator
                    ? "border-dashed border-ink/30 bg-white/20 text-ink/30"
                    : "border-ink bg-white text-ink"
                }`}
              >
                {isNullTerminator ? "\\0" : String(value)}
              </div>

              {/* Index label */}
              <span className="text-xs font-extrabold text-ink/50">{index}</span>

              {/* Bottom pointer indicators */}
              <div className="h-6">
                {isActive && (
                  <span className="rounded bg-forest px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                    curr
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm font-bold text-ink/60">
        {targetIndex !== null ? `Target index: ${targetIndex}` : "Traversing sequence"}
      </p>
    </div>
  );
}
