"use client";

import type { CallStackSnapshot } from "@/lib/engines";

export function CallStackLab({ snapshot }: { snapshot: CallStackSnapshot }) {
  const { stack, returnValue, complete } = snapshot;

  return (
    <div className="flex min-h-[390px] flex-col justify-between rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="flex flex-1 flex-col-reverse items-center justify-center gap-2">
        {stack.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10">
            {complete && returnValue !== null ? (
              <div className="rounded-2xl border-2 border-forest bg-lime p-6 text-center shadow-[4px_4px_0_#13211b]">
                <span className="text-[10px] font-black uppercase text-forest">Recursion Complete</span>
                <h3 className="display text-2xl font-black mt-1">Final Result: {returnValue}</h3>
              </div>
            ) : (
              <p className="text-sm font-bold text-ink/40">Stack is empty.</p>
            )}
          </div>
        ) : (
          stack.map((frame, index) => {
            const isTop = index === stack.length - 1;
            const hasReturn = frame.returnValue !== undefined;

            return (
              <div
                key={index}
                className={`w-full max-w-sm rounded-xl border-2 p-3 transition-all ${
                  isTop
                    ? "border-ink bg-orange text-white shadow-[3px_3px_0_#13211b] -translate-y-1"
                    : "border-ink bg-white text-ink"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-mono text-sm font-black">
                    {frame.functionName}({frame.arg})
                  </div>
                  {hasReturn && (
                    <span className={`rounded px-1.5 py-0.5 text-[10px] font-black uppercase ${isTop ? "bg-white text-orange" : "bg-lime text-forest"}`}>
                      returns {frame.returnValue}
                    </span>
                  )}
                </div>
                {isTop && (
                  <div className="mt-1 text-[10px] font-bold text-white/80 uppercase">
                    Active Stack Frame
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      <div className="mt-4 text-center text-xs font-bold text-ink/50 uppercase">
        Stack Size: {stack.length}
      </div>
    </div>
  );
}
