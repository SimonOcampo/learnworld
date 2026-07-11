"use client";

import type { BloomSnapshot } from "@/lib/engines";

export function BloomLab({ snapshot }: { snapshot: BloomSnapshot }) {
  const { size, bitset, lastInserted, lastQueried, hashIndices, queryResult } = snapshot;

  return (
    <div className="flex min-h-[390px] flex-col justify-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="space-y-6">
        {/* State Details Panel */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Operations History */}
          <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#13211b]">
            <h4 className="display mb-3 text-xs font-black uppercase text-ink/50">Current Operation</h4>
            <div className="space-y-2 text-xs font-bold text-ink">
              {lastInserted && (
                <div className="flex justify-between border-b border-ink/5 pb-1">
                  <span>Inserted Item</span>
                  <span className="font-extrabold text-forest">&quot;{lastInserted}&quot;</span>
                </div>
              )}
              {lastQueried && (
                <div className="flex justify-between border-b border-ink/5 pb-1">
                  <span>Queried Item</span>
                  <span className="font-extrabold text-orange">&quot;{lastQueried}&quot;</span>
                </div>
              )}
              {hashIndices.length > 0 && (
                <div className="flex justify-between border-b border-ink/5 pb-1">
                  <span>Hash Indices</span>
                  <span className="font-mono font-extrabold text-ink">{JSON.stringify(hashIndices)}</span>
                </div>
              )}
              {queryResult !== null && lastQueried && (
                <div className="flex justify-between pb-1">
                  <span>Query Result</span>
                  <span className={`font-black uppercase ${queryResult ? "text-forest" : "text-orange"}`}>
                    {queryResult ? "Probably In Filter" : "Definitely Not In Filter"}
                  </span>
                </div>
              )}
              {!lastInserted && !lastQueried && (
                <div className="text-ink/40 text-center py-2">Bloom filter initialized.</div>
              )}
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#13211b] flex flex-col justify-center">
            <span className="text-[10px] font-black uppercase text-ink/50 block mb-1">Bloom Filter Config</span>
            <div className="font-mono text-sm font-black text-ink">
              Size (m): {size} bits
            </div>
            <div className="font-mono text-sm font-black text-ink mt-1">
              Hash Functions (k): {snapshot.hashes}
            </div>
          </div>
        </div>

        {/* Bitset Array Display */}
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b]">
          <h3 className="display mb-3 text-sm font-black uppercase text-ink">Bit Array</h3>
          
          <div className="flex flex-wrap gap-2 justify-center">
            {bitset.map((bit, idx) => {
              const isHashed = hashIndices.includes(idx);
              const isSet = bit === 1;

              return (
                <div key={idx} className="flex flex-col items-center gap-1">
                  <div
                    className={`flex h-12 w-10 flex-col items-center justify-center rounded-xl border-2 font-mono text-sm font-black shadow-sm transition-all ${
                      isHashed
                        ? "border-ink bg-orange text-white shadow-[2px_2px_0_#13211b] -translate-y-0.5"
                        : isSet
                        ? "border-forest bg-lime text-ink"
                        : "border-ink bg-white text-ink"
                    }`}
                  >
                    {bit}
                  </div>
                  <span className="text-[9px] font-extrabold text-ink/40">{idx}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
