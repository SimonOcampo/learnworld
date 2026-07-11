"use client";

import type { GreedySnapshot } from "@/lib/engines";

export function GreedyLab({ snapshot }: { snapshot: GreedySnapshot }) {
  const { problem, items, selectedIds, currentWeight, currentValue, capacity } = snapshot;

  const isKnapsack = problem === "knapsack";

  // Timeline boundaries for activity selection (typically 0 to 12 or 16)
  const maxEnd = items.length > 0 ? Math.max(...items.map(i => i.end ?? 0)) : 10;
  const timelineMax = Math.max(maxEnd + 1, 10);

  return (
    <div className="flex min-h-[390px] flex-col justify-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left Column: Visual Container (Knapsack or Timeline) */}
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b] flex flex-col justify-between">
          <h3 className="display mb-3 text-lg font-black uppercase text-ink">
            {isKnapsack ? "Knapsack Status" : "Schedule Timeline"}
          </h3>

          {isKnapsack ? (
            /* Knapsack Graphic */
            <div className="flex-1 flex flex-col justify-center items-center">
              <div className="relative w-44 h-48 rounded-b-3xl border-x-4 border-b-4 border-ink bg-cream/40 overflow-hidden flex flex-col justify-end p-2 shadow-inner">
                {/* Visual fill representation */}
                <div
                  className="absolute bottom-0 left-0 right-0 bg-lime/30 border-t-2 border-dashed border-forest transition-all"
                  style={{ height: `${(currentWeight / capacity) * 100}%` }}
                />
                
                <div className="z-10 text-center font-bold">
                  <div className="text-xl font-black text-ink">{currentValue} pt</div>
                  <div className="text-xs text-ink/65 mt-0.5">{currentWeight} / {capacity} kg</div>
                </div>
              </div>
              
              <div className="mt-4 text-xs font-black uppercase text-ink/50">
                Selected: {selectedIds.join(", ") || "None"}
              </div>
            </div>
          ) : (
            /* Activity Selection Timeline */
            <div className="flex-1 flex flex-col justify-center gap-3">
              <div className="relative h-6 bg-ink/10 rounded-lg flex items-center px-2">
                <span className="text-[10px] font-black text-ink/50">Timeline</span>
                <div className="absolute inset-x-0 flex justify-between px-2 font-mono text-[8px] font-bold text-ink/40">
                  {Array.from({ length: timelineMax }).map((_, i) => (
                    <span key={i}>{i}</span>
                  ))}
                </div>
              </div>

              <div className="space-y-2 mt-2">
                {items.map((act) => {
                  const start = act.start ?? 0;
                  const end = act.end ?? 0;
                  const duration = end - start;
                  const leftPercent = (start / timelineMax) * 100;
                  const widthPercent = (duration / timelineMax) * 100;

                  const isSelected = selectedIds.includes(act.id);

                  return (
                    <div key={act.id} className="relative h-7 w-full border border-ink/5 bg-cream/30 rounded">
                      <div
                        className={`absolute h-full rounded border-2 flex items-center justify-center font-mono text-[10px] font-black shadow-sm transition-all ${
                          isSelected
                            ? "border-forest bg-lime text-ink"
                            : "border-ink/20 bg-white text-ink/50"
                        }`}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                        }}
                      >
                        {act.id} [{start}–{end}]
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Items / Candidates Panel */}
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b] overflow-y-auto max-h-[300px]">
          <h3 className="display mb-3 text-lg font-black uppercase text-ink">Candidates List</h3>
          
          <div className="space-y-3">
            {items.map((item) => {
              const isSelected = selectedIds.some(id => id === item.id || id.startsWith(`${item.id} `));
              const hasRatio = item.ratio !== undefined;
              const hasInterval = item.start !== undefined && item.end !== undefined;

              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    isSelected
                      ? "border-forest bg-lime/10 text-ink shadow-[2px_2px_0_#1f5b45]"
                      : "border-ink/10 bg-cream text-ink/65"
                  }`}
                >
                  <div>
                    <div className="font-extrabold text-sm">Item {item.id}</div>
                    {hasRatio && (
                      <span className="text-[10px] text-ink/50 font-bold block mt-0.5">
                        Val: {item.value} | Wt: {item.weight}
                      </span>
                    )}
                    {hasInterval && (
                      <span className="text-[10px] text-ink/50 font-bold block mt-0.5">
                        Interval: [{item.start}, {item.end}]
                      </span>
                    )}
                  </div>
                  <div>
                    {hasRatio && (
                      <span className="rounded bg-orange px-2 py-0.5 font-mono text-xs font-black text-white">
                        {item.ratio?.toFixed(2)} v/w
                      </span>
                    )}
                    {isSelected && (
                      <span className="ml-2 rounded bg-forest px-1.5 py-0.5 font-mono text-[9px] font-bold text-white uppercase">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
