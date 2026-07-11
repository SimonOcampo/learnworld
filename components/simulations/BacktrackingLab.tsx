"use client";

import type { BacktrackingSnapshot } from "@/lib/engines";

export function BacktrackingLab({ snapshot }: { snapshot: BacktrackingSnapshot }) {
  const { problem, size, board, path = [], currentSelection = [], success, complete } = snapshot;

  const isNQueens = problem === "n-queens" && board !== undefined;

  return (
    <div className="flex min-h-[390px] flex-col justify-center items-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      {isNQueens ? (
        /* Chess Board for N-Queens */
        <div className="flex flex-col items-center">
          <span className="mb-4 text-xs font-black uppercase text-ink/50">
            {size}-Queens Chess Board
          </span>

          <div
            className="grid border-4 border-ink rounded-2xl overflow-hidden bg-white shadow-[4px_4px_0_#13211b]"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              width: `${Math.min(size * 48, 320)}px`,
              height: `${Math.min(size * 48, 320)}px`,
            }}
          >
            {board.map((row, rIdx) =>
              row.map((val, cIdx) => {
                const isEven = (rIdx + cIdx) % 2 === 0;
                const hasQueen = val === 1;

                return (
                  <div
                    key={`${rIdx}-${cIdx}`}
                    className={`flex items-center justify-center border border-ink/10 transition-all ${
                      hasQueen
                        ? "bg-orange text-white"
                        : isEven
                        ? "bg-white"
                        : "bg-ink/5"
                    }`}
                  >
                    {hasQueen && (
                      <span className="text-2xl font-bold select-none drop-shadow-sm">♕</span>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {complete && (
            <div className={`mt-4 rounded-xl border px-4 py-1.5 text-xs font-black uppercase ${
              success ? "bg-lime text-forest border-forest/30" : "bg-orange/10 text-orange border-orange/30"
            }`}>
              {success ? "Success: Solution Found" : "Complete: No Solution"}
            </div>
          )}
        </div>
      ) : problem === "maze" && board ? (
        <div className="flex flex-col items-center"><span className="mb-4 text-xs font-black uppercase text-ink/50">Maze search</span><div className="grid overflow-hidden rounded-xl border-4 border-ink" style={{ gridTemplateColumns: `repeat(${size}, 42px)` }}>{board.map((row, rowIndex) => row.map((cell, colIndex) => { const onPath = path.some(([pathRow, pathCol]) => pathRow === rowIndex && pathCol === colIndex); return <div key={`${rowIndex}-${colIndex}`} className={`flex h-10 w-10 items-center justify-center border border-ink/10 ${cell ? "bg-ink" : onPath ? "bg-lime" : "bg-white"}`}>{onPath && "•"}</div>; }))}</div><p className="mt-4 text-xs font-bold">{complete ? success ? "Path found" : "No path found" : "Exploring path"}</p></div>
      ) : problem === "subset-sum" ? (
        <div className="text-center"><p className="text-xs font-black uppercase text-ink/50">Subset-sum search</p><div className="mt-4 flex flex-wrap justify-center gap-2">{currentSelection.map((value, index) => <span key={`${value}-${index}`} className="rounded-lg bg-lime px-3 py-2 font-black">{value}</span>)}</div><p className="mt-4 text-sm font-bold">{complete ? success ? "Matching subset found" : "No matching subset" : "Trying combinations"}</p></div>
      ) : <div className="text-center font-bold text-ink/40">Backtracking in progress ({problem})...</div>}
    </div>
  );
}
