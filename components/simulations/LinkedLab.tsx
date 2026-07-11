"use client";

import type { LinkedSnapshot } from "@/lib/engines";

export function LinkedLab({ snapshot }: { snapshot: LinkedSnapshot }) {
  const { nodes, head, currentNodeId, prevNodeId } = snapshot;

  // Detect if this is a skip list based on whether any node has a level/express lane
  const isSkipList = nodes.some(n => n.express !== undefined || n.level !== undefined);

  // Traverse regular linked list in logical order from head
  const getOrderedList = () => {
    const list = [];
    let currId = head;
    const visited = new Set<string>();
    while (currId && !visited.has(currId)) {
      const node = nodes.find(n => n.id === currId);
      if (!node) break;
      list.push(node);
      visited.add(currId);
      currId = node.next;
    }
    return list;
  };

  const ordered = isSkipList ? nodes : getOrderedList();

  return (
    <div className="flex min-h-[390px] flex-col justify-center overflow-x-auto rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      {isSkipList ? (
        /* Skip List Visualizer */
        <div className="mx-auto flex flex-col gap-8 min-w-max p-4">
          {/* Level 1: Express Lane */}
          <div className="flex items-center gap-1">
            <span className="w-24 text-xs font-black uppercase text-ink/50">Level 1 (Express)</span>
            <div className="flex items-center">
              {nodes.map((node, index) => {
                const hasExpress = node.level === 1;
                const isCurrent = currentNodeId === node.id;
                
                return (
                  <div key={`l1-${node.id}`} className="flex items-center">
                    {hasExpress ? (
                      <div
                        className={`flex h-12 w-16 flex-col items-center justify-center rounded-xl border-2 font-black transition-all ${
                          isCurrent
                            ? "border-ink bg-orange text-white shadow-[3px_3px_0_#13211b]"
                            : "border-ink bg-white text-ink"
                        }`}
                      >
                        <span className="text-xs">{node.value}</span>
                      </div>
                    ) : (
                      <div className="h-12 w-16" /> // spacer
                    )}
                    {index < nodes.length - 1 && (
                      <div className="flex h-0.5 w-10 bg-ink/30 justify-center items-center">
                        {hasExpress && nodes[index + 1]?.level === 1 && (
                          <span className="text-[10px] text-ink font-bold">═▶</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Level 0: Normal Lane */}
          <div className="flex items-center gap-1">
            <span className="w-24 text-xs font-black uppercase text-ink/50">Level 0 (Normal)</span>
            <div className="flex items-center">
              {nodes.map((node, index) => {
                const isCurrent = currentNodeId === node.id;

                return (
                  <div key={`l0-${node.id}`} className="flex items-center">
                    <div
                      className={`flex h-12 w-16 flex-col items-center justify-center rounded-xl border-2 font-black transition-all ${
                        isCurrent
                          ? "border-ink bg-orange text-white shadow-[3px_3px_0_#13211b]"
                          : "border-ink bg-white/70 text-ink/60"
                      }`}
                    >
                      <span className="text-xs">{node.value}</span>
                    </div>
                    {index < nodes.length - 1 && (
                      <div className="flex h-0.5 w-10 bg-ink/30 justify-center items-center">
                        <span className="text-[10px] text-ink font-bold">▶</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Regular Linked List Visualizer */
        <div className="mx-auto flex min-w-max items-center gap-2 py-4">
          <div className="flex items-center gap-1">
            <span className="rounded-full bg-forest px-2 py-1 text-[10px] font-black uppercase text-white shadow-sm">
              Head
            </span>
            <span className="text-ink font-bold">→</span>
          </div>

          {ordered.length === 0 ? (
            <span className="font-mono text-sm font-bold text-ink/40">NULL</span>
          ) : (
            <>
              {ordered.map((node, index) => {
                const isCurrent = currentNodeId === node.id;
                const isPrev = prevNodeId === node.id;

                return (
                  <div key={node.id} className="flex items-center gap-2">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`flex h-14 w-16 flex-col items-center justify-center rounded-xl border-2 font-black shadow-sm transition-all ${
                          isCurrent
                            ? "-translate-y-1 border-ink bg-orange text-white shadow-[4px_4px_0_#13211b]"
                            : isPrev
                            ? "border-dashed border-ink bg-lime text-ink"
                            : "border-ink bg-white text-ink"
                        }`}
                      >
                        <span className="text-sm">{node.value}</span>
                      </div>
                      <span className="text-[9px] font-extrabold text-ink/40">idx {index}</span>
                    </div>

                    <div className="flex flex-col items-center">
                      <span className="text-xl font-bold text-ink/40">→</span>
                      {node.next === null && (
                        <span className="font-mono text-[9px] font-bold text-ink/30">NULL</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}
