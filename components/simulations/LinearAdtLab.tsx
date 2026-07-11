"use client";

import type { LinearAdtSnapshot } from "@/lib/engines";

export function LinearAdtLab({ snapshot, concept }: { snapshot: LinearAdtSnapshot; concept: string }) {
  const { items, activeItem } = snapshot;
  const isStack = concept === "stacks";

  return (
    <div className="flex min-h-[390px] flex-col justify-center items-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      {isStack ? (
        /* Stack Visualization (Vertical) */
        <div className="flex flex-col items-center">
          <span className="mb-4 text-xs font-black uppercase text-ink/50">Stack (LIFO)</span>
          <div className="relative flex flex-col-reverse items-center gap-1.5 w-48 min-h-[220px] rounded-b-2xl border-x-4 border-b-4 border-ink bg-white/40 p-3">
            {items.length === 0 ? (
              <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-ink/30">
                EMPTY
              </span>
            ) : (
              items.map((item, idx) => {
                const isActive = item === activeItem && idx === items.length - 1;
                return (
                  <div
                    key={idx}
                    className={`w-full py-3 text-center rounded-xl border-2 font-black shadow-sm transition-all ${
                      isActive
                        ? "border-ink bg-orange text-white shadow-[3px_3px_0_#13211b]"
                        : "border-ink bg-white text-ink"
                    }`}
                  >
                    {item}
                    {idx === items.length - 1 && (
                      <span className="block text-[8px] uppercase tracking-wider font-extrabold text-ink/40 mt-0.5">
                        Top
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        /* Queue Visualization (Horizontal) */
        <div className="flex flex-col items-center w-full">
          <span className="mb-4 text-xs font-black uppercase text-ink/50">Queue (FIFO)</span>
          <div className="relative flex items-center gap-2 w-full max-w-lg min-h-[100px] rounded-2xl border-y-4 border-ink bg-white/40 p-4">
            <span className="absolute -left-10 text-[10px] font-black uppercase text-forest">Front</span>
            <span className="absolute -right-10 text-[10px] font-black uppercase text-forest">Rear</span>

            {items.length === 0 ? (
              <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-bold text-ink/30">
                EMPTY
              </span>
            ) : (
              <div className="flex w-full justify-start gap-3 overflow-x-auto py-2">
                {items.map((item, idx) => {
                  const isActive = item === activeItem && idx === 0;
                  return (
                    <div
                      key={idx}
                      className={`flex-1 min-w-[70px] py-4 text-center rounded-xl border-2 font-black shadow-sm transition-all ${
                        isActive
                          ? "border-ink bg-orange text-white shadow-[3px_3px_0_#13211b]"
                          : "border-ink bg-white text-ink"
                      }`}
                    >
                      {item}
                      {idx === 0 && (
                        <span className="block text-[8px] uppercase tracking-wider font-extrabold text-ink/40 mt-0.5">
                          Head
                        </span>
                      )}
                      {idx === items.length - 1 && idx !== 0 && (
                        <span className="block text-[8px] uppercase tracking-wider font-extrabold text-ink/40 mt-0.5">
                          Tail
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
