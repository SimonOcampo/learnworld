"use client";

import type { ComplexitySnapshot } from "@/lib/engines";

export function ComplexityLab({ snapshot }: { snapshot: ComplexitySnapshot }) {
  const { f_n, g_n, c, n0, currentN, f_val, g_val, relationshipSatisfied } = snapshot;

  // We can build a history list of tested values of n to show in a table
  const testValues = [];
  if (currentN !== null) {
    // Generate a range of values around n0 or up to currentN
    const limit = Math.max(currentN, 8);
    for (let i = 1; i <= limit; i++) {
      testValues.push(i);
    }
  }

  // Calculate percentages for a visual bar chart at the current n
  const maxVal = Math.max(f_val || 0, g_val || 0, 1);
  const fPercent = f_val !== null ? (f_val / maxVal) * 100 : 0;
  const gPercent = g_val !== null ? (g_val / maxVal) * 100 : 0;

  return (
    <div className="flex min-h-[390px] flex-col justify-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="grid gap-6 md:grid-cols-2">
        {/* Equations and Visual Comparison */}
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b]">
          <h3 className="display mb-3 text-lg font-black uppercase text-ink">Growth Bounds</h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-[10px] font-black uppercase text-ink/50">Functions</span>
              <div className="text-sm font-bold text-ink">
                f(n) = <span className="font-extrabold text-orange">{f_n || "—"}</span>
              </div>
              {g_n && (
                <div className="text-sm font-bold text-ink mt-1">
                  g(n) = <span className="font-extrabold text-forest">{g_n}</span>
                </div>
              )}
              {c !== null && n0 !== null && (
                <div className="text-[10px] font-black text-ink/60 uppercase mt-2">
                  Parameters: c = {c}, n₀ = {n0}
                </div>
              )}
            </div>

            {currentN !== null && f_val !== null && (
              <div className="rounded-xl border border-ink/10 bg-cream p-4">
                <span className="text-[10px] font-black uppercase text-ink/50">At n = {currentN}</span>
                <div className="mt-3 space-y-2">
                  {/* f(n) bar */}
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-1">
                      <span>f(n) value</span>
                      <span>{f_val}</span>
                    </div>
                    <div className="h-3 w-full bg-ink/10 rounded-full overflow-hidden">
                      <div className="h-full bg-orange transition-all" style={{ width: `${fPercent}%` }} />
                    </div>
                  </div>

                  {/* c * g(n) or g(n) bar */}
                  {g_val !== null && (
                    <div>
                      <div className="flex justify-between text-xs font-bold mb-1">
                        <span>{c !== null ? `c * g(n)` : `g(n)`} value</span>
                        <span>{g_val}</span>
                      </div>
                      <div className="h-3 w-full bg-ink/10 rounded-full overflow-hidden">
                        <div className="h-full bg-forest transition-all" style={{ width: `${gPercent}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {relationshipSatisfied !== null && (
                  <div className={`mt-4 text-center rounded-lg py-1.5 text-xs font-black uppercase ${
                    relationshipSatisfied
                      ? "bg-lime text-forest border border-forest/30"
                      : "bg-orange/10 text-orange border border-orange/30"
                  }`}>
                    Relation: {relationshipSatisfied ? "Satisfied (True)" : "Violated (False)"}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Growth Value Table */}
        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b] overflow-hidden">
          <h3 className="display mb-3 text-lg font-black uppercase text-ink">Evaluation Table</h3>
          {currentN === null ? (
            <p className="text-sm font-bold text-ink/40">Step to begin analysis.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-bold">
                <thead>
                  <tr className="border-b border-ink/10 text-ink/40">
                    <th className="pb-2">n</th>
                    <th className="pb-2">f(n)</th>
                    {g_n && <th className="pb-2">{c !== null ? `c * g(n)` : `g(n)`}</th>}
                    <th className="pb-2">Satisfied?</th>
                  </tr>
                </thead>
                <tbody>
                  {testValues.map((n) => {
                    const isActive = n === currentN;
                    
                    
                    return (
                      <tr
                        key={n}
                        className={`border-b border-ink/5 transition-all ${
                          isActive ? "bg-lime/20 text-ink" : "text-ink/65"
                        }`}
                      >
                        <td className="py-2">
                          {n} {n0 !== null && n === n0 && <span className="text-[9px] text-forest font-black ml-1">(n₀)</span>}
                        </td>
                        <td className="py-2">
                          {isActive ? f_val : "—"}
                        </td>
                        {g_n && (
                          <td className="py-2">
                            {isActive ? g_val : "—"}
                          </td>
                        )}
                        <td className="py-2">
                          {isActive ? (
                            relationshipSatisfied ? (
                              <span className="text-forest">Yes</span>
                            ) : (
                              <span className="text-orange">No</span>
                            )
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
