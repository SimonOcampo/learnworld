"use client";

import type { RecurrenceSnapshot } from "@/lib/engines";

export function RecurrenceLab({ snapshot }: { snapshot: RecurrenceSnapshot }) {
  const { a, b, fn, log_b_a, applicableCase, complexityBound, currentSubproblemSize, subproblemCount } = snapshot;

  const showSubproblems = currentSubproblemSize !== undefined && subproblemCount !== undefined;

  return (
    <div className="flex min-h-[390px] flex-col justify-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Recurrence Equation Card */}
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b]">
          <h3 className="display mb-3 text-lg font-black uppercase text-ink">Recurrence Formula</h3>
          
          <div className="space-y-4">
            <div className="rounded-xl border border-ink bg-cream p-4 text-center">
              <span className="text-[10px] font-black uppercase text-ink/50 block mb-1">Relation</span>
              <div className="font-mono text-base font-black text-ink">
                T(n) = {a}T(n/{b}) + O({fn})
              </div>
            </div>

            <div className="space-y-2 text-xs font-bold text-ink/70">
              <div className="flex justify-between border-b border-ink/5 pb-1">
                <span>Branching factor (a)</span>
                <span className="font-extrabold text-ink">{a}</span>
              </div>
              <div className="flex justify-between border-b border-ink/5 pb-1">
                <span>Divide factor (b)</span>
                <span className="font-extrabold text-ink">{b}</span>
              </div>
              <div className="flex justify-between border-b border-ink/5 pb-1">
                <span>Work function f(n)</span>
                <span className="font-extrabold text-ink">O({fn})</span>
              </div>
              <div className="flex justify-between pb-1">
                <span>Critical exponent log_b(a)</span>
                <span className="font-extrabold text-orange">{log_b_a.toFixed(2)}</span>
              </div>
            </div>

            {complexityBound && (
              <div className="rounded-xl border-2 border-forest bg-lime p-3 text-center shadow-sm">
                <span className="text-[10px] font-black uppercase text-forest block">Asymptotic Complexity</span>
                <div className="font-mono text-sm font-black text-ink mt-1">{complexityBound}</div>
              </div>
            )}
          </div>
        </div>

        {/* Master Theorem Case Cards / Divide & Conquer Stack */}
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b]">
          {showSubproblems ? (
            <div>
              <h3 className="display mb-3 text-lg font-black uppercase text-ink">Divide & Conquer State</h3>
              
              <div className="space-y-4 mt-6">
                <div className="flex items-center justify-between rounded-xl border border-ink/10 bg-cream p-3">
                  <span className="text-xs font-bold text-ink/60">Subproblems Size</span>
                  <div className="rounded-lg border-2 border-ink bg-white px-3 py-1 font-mono text-sm font-black">
                    {currentSubproblemSize.toFixed(1)}
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-ink/10 bg-cream p-3">
                  <span className="text-xs font-bold text-ink/60">Subproblems Count</span>
                  <div className="rounded-lg border-2 border-ink bg-white px-3 py-1 font-mono text-sm font-black">
                    {subproblemCount}
                  </div>
                </div>

                {/* Draw simple subproblem boxes representation */}
                <div className="flex flex-wrap gap-1 justify-center py-2 max-h-[100px] overflow-y-auto">
                  {Array.from({ length: Math.min(subproblemCount, 32) }).map((_, idx) => (
                    <div key={idx} className="h-6 w-6 rounded border border-ink bg-orange/20 flex items-center justify-center font-mono text-[8px] font-black">
                      n/{b}
                    </div>
                  ))}
                  {subproblemCount > 32 && (
                    <div className="text-[10px] font-bold text-ink/40 self-end ml-1">
                      + {subproblemCount - 32} more
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div>
              <h3 className="display mb-3 text-lg font-black uppercase text-ink">Master Theorem Cases</h3>
              
              <div className="space-y-3">
                {[1, 2, 3].map((caseNum) => {
                  const isActive = applicableCase === caseNum;
                  return (
                    <div
                      key={caseNum}
                      className={`rounded-xl border p-3 transition-all ${
                        isActive
                          ? "border-ink bg-orange text-white shadow-[3px_3px_0_#13211b] -translate-y-0.5"
                          : "border-ink/10 bg-cream text-ink/60"
                      }`}
                    >
                      <div className="text-xs font-black uppercase">Case {caseNum}</div>
                      <p className="text-[10px] font-medium mt-1">
                        {caseNum === 1 && "f(n) is asymptotically slower than n^(log_b a)"}
                        {caseNum === 2 && "f(n) is asymptotically equal to n^(log_b a)"}
                        {caseNum === 3 && "f(n) is asymptotically faster than n^(log_b a)"}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
