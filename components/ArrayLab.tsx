"use client";

import type { ArraySnapshot } from "@/lib/engines";

export function ArrayLab({ snapshot, concept }: { snapshot: ArraySnapshot; concept: "binary_search" | "insertion_sort" }) {
  return (
    <div className="flex min-h-[390px] flex-col justify-center overflow-x-auto rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="mx-auto flex min-w-max items-end gap-2">
        {snapshot.values.map((value, index) => {
          const inRange = concept === "binary_search" && snapshot.low !== null && snapshot.high !== null && index >= snapshot.low && index <= snapshot.high;
          const active = snapshot.comparing.includes(index);
          const sorted = concept === "insertion_sort" && index <= snapshot.sortedThrough;
          const discarded = concept === "binary_search" && !inRange && !snapshot.complete;
          return (
            <div key={index} className="flex w-14 flex-col items-center gap-2">
              {snapshot.mid === index && <span className="rounded-full bg-orange px-2 py-1 text-[10px] font-black uppercase">mid</span>}
              <div className={`flex h-16 w-14 items-center justify-center rounded-2xl border-2 text-xl font-black shadow-sm transition-all ${active ? "-translate-y-2 border-ink bg-orange" : sorted ? "border-forest bg-lime" : discarded ? "border-ink/10 bg-white/40 text-ink/30" : "border-ink bg-white"}`}>{value}</div>
              <span className="text-xs font-bold text-ink/50">{index}</span>
              {snapshot.low === index && <span className="text-[10px] font-black uppercase text-forest">low</span>}
              {snapshot.high === index && <span className="text-[10px] font-black uppercase text-forest">high</span>}
            </div>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm font-semibold text-ink/55">{concept === "binary_search" ? `Target: ${snapshot.target}` : `Sorted prefix: indices 0–${snapshot.sortedThrough}`}</p>
    </div>
  );
}
