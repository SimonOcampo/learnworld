"use client";

import type { TrieSnapshot } from "@/lib/engines";

export function TrieLab({ snapshot }: { snapshot: TrieSnapshot }) {
  const { nodes, rootId, currentNodeId, currentWord } = snapshot;

  const renderTrieNode = (nodeId: string): React.ReactNode => {
    const node = nodes[nodeId];
    if (!node) return null;
    const isCurrent = currentNodeId === nodeId;
    const childKeys = Object.keys(node.children);

    return (
      <div className="flex flex-col items-center">
        {/* Node Circle */}
        <div
          className={`flex h-12 w-12 flex-col items-center justify-center rounded-full border-2 font-black shadow-sm transition-all ${
            isCurrent
              ? "border-ink bg-orange text-white shadow-[3px_3px_0_#13211b]"
              : node.isEndOfWord
              ? "border-forest bg-lime text-ink"
              : "border-ink bg-white text-ink"
          }`}
        >
          <span className="text-xs">{node.char || "root"}</span>
        </div>

        {/* Children Row */}
        {childKeys.length > 0 && (
          <div className="relative flex gap-6 mt-6">
            {childKeys.map((char) => {
              const childId = node.children[char];
              return (
                <div key={childId} className="flex flex-col items-center relative">
                  <div className="absolute -top-6 h-6 w-0.5 bg-ink/20" />
                  {renderTrieNode(childId)}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex min-h-[390px] flex-col justify-between rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="flex flex-1 items-center justify-center overflow-auto py-6">
        {rootId && nodes[rootId] ? (
          renderTrieNode(rootId)
        ) : (
          <p className="text-sm font-bold text-ink/40">Trie is empty.</p>
        )}
      </div>

      {currentWord && (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-3 text-center text-xs font-bold text-ink/65">
          <span className="text-forest uppercase mr-2">Searching Path:</span>
          &quot;{currentWord}&quot;
        </div>
      )}
    </div>
  );
}
