"use client";

import type { MemorySnapshot } from "@/lib/engines";

export function MemoryLab({ snapshot }: { snapshot: MemorySnapshot }) {
  const { variables, heapAllocations } = snapshot;

  return (
    <div className="flex min-h-[390px] flex-col justify-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Stack Variables */}
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b]">
          <h3 className="display mb-3 text-lg font-black uppercase text-ink">Variables (Stack)</h3>
          {variables.length === 0 ? (
            <p className="text-sm font-bold text-ink/40">No variables allocated.</p>
          ) : (
            <div className="space-y-3">
              {variables.map((v, i) => {
                const isPointerVal = v.value.startsWith("0x");
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-ink/10 bg-cream p-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-ink/50">{v.type}</span>
                      <div className="font-extrabold text-ink">{v.name}</div>
                      <span className="font-mono text-[10px] text-ink/40">{v.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isPointerVal && (
                        <span className="rounded bg-orange px-1.5 py-0.5 font-mono text-[9px] font-bold text-white">
                          PTR → {v.value}
                        </span>
                      )}
                      <div className="rounded-lg border-2 border-ink bg-white px-3 py-1 font-mono text-sm font-black shadow-sm">
                        {v.value}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Heap Allocations */}
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b]">
          <h3 className="display mb-3 text-lg font-black uppercase text-ink">Heap Memory</h3>
          {heapAllocations.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-xl border border-dashed border-ink/20">
              <p className="text-sm font-bold text-ink/40">Heap is empty.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {heapAllocations.map((h, i) => (
                <div key={i} className="relative rounded-xl border border-ink bg-lime/10 p-3">
                  <div className="absolute top-2 right-2 rounded bg-forest px-1 py-0.5 font-mono text-[8px] font-bold text-white">
                    {h.size}B
                  </div>
                  <span className="font-mono text-[10px] font-bold text-ink/50">{h.address}</span>
                  {h.label && <div className="text-[10px] font-black text-forest/70">{h.label}</div>}
                  <div className="mt-2 rounded border border-ink bg-white py-1 text-center font-mono text-xs font-black">
                    val: {h.value}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
