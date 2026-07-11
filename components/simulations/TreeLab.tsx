"use client";

import type { TreeSnapshot } from "@/lib/engines";

/* ── layout constants ───────────────────────────────────────────────── */
const NODE_R = 25;          // node circle radius
const NODE_DIAMETER = NODE_R * 2;
const H_GAP = 16;           // minimum horizontal gap between sibling subtrees
const V_GAP = 60;           // vertical spacing between levels
const LABEL_FONT = 13;

/* ── layout types ───────────────────────────────────────────────────── */
type LayoutNode = {
  id: string;
  x: number;
  y: number;
  width: number;
  leftChild: LayoutNode | null;
  rightChild: LayoutNode | null;
};

/* ── recursive layout engine ────────────────────────────────────────── */
function layoutTree(
  nodeId: string | null,
  nodes: Record<string, import("@/lib/engines").TreeNode>,
  depth: number
): LayoutNode | null {
  if (!nodeId || !nodes[nodeId]) return null;
  const node = nodes[nodeId];

  const leftLayout = layoutTree(node.leftId, nodes, depth + 1);
  const rightLayout = layoutTree(node.rightId, nodes, depth + 1);

  const leftWidth = leftLayout?.width ?? 0;
  const rightWidth = rightLayout?.width ?? 0;

  // Total width is children side-by-side plus a gap, or at minimum the node itself
  const childrenWidth = leftWidth + rightWidth + (leftWidth && rightWidth ? H_GAP : 0);
  const totalWidth = Math.max(NODE_DIAMETER, childrenWidth);

  // This node is centered in its bounding box
  const x = totalWidth / 2;
  const y = depth * (NODE_DIAMETER + V_GAP) + NODE_R;

  // Position children relative to this node's bounding box
  if (leftLayout) {
    leftLayout.x = leftWidth / 2; // centered in left half
  }
  if (rightLayout) {
    rightLayout.x = totalWidth - rightWidth / 2; // centered in right half
  }

  return {
    id: nodeId,
    x,
    y,
    width: totalWidth,
    leftChild: leftLayout,
    rightChild: rightLayout,
  };
}

/* ── compute tree depth ─────────────────────────────────────────────── */
function getDepth(layout: LayoutNode | null): number {
  if (!layout) return 0;
  return 1 + Math.max(getDepth(layout.leftChild), getDepth(layout.rightChild));
}

/* ── render helpers ─────────────────────────────────────────────────── */
function collectEdges(layout: LayoutNode, offsetX: number): { x1: number; y1: number; x2: number; y2: number }[] {
  const edges: { x1: number; y1: number; x2: number; y2: number }[] = [];
  const px = offsetX + layout.x;
  const py = layout.y;

  if (layout.leftChild) {
    // Left child offset: starts at 0 relative to parent's bounding box
    const childOffsetX = offsetX;
    const cx = childOffsetX + layout.leftChild.x;
    const cy = layout.leftChild.y;
    edges.push({ x1: px, y1: py + NODE_R, x2: cx, y2: cy - NODE_R });
    edges.push(...collectEdges(layout.leftChild, childOffsetX));
  }
  if (layout.rightChild) {
    // The right child starts at the far end of the parent's bounding box.
    const totalWidth = layout.width;
    const rightWidth = layout.rightChild.width;
    const rightChildOffsetX = offsetX + totalWidth - rightWidth;
    const cx = rightChildOffsetX + layout.rightChild.x;
    const cy = layout.rightChild.y;
    edges.push({ x1: px, y1: py + NODE_R, x2: cx, y2: cy - NODE_R });
    edges.push(...collectEdges(layout.rightChild, rightChildOffsetX));
  }
  return edges;
}

type NodeInfo = {
  id: string;
  cx: number;
  cy: number;
};

function collectNodes(layout: LayoutNode, offsetX: number): NodeInfo[] {
  const result: NodeInfo[] = [];
  const totalWidth = layout.width;
  const rightWidth = layout.rightChild?.width ?? 0;

  result.push({
    id: layout.id,
    cx: offsetX + layout.x,
    cy: layout.y,
  });

  if (layout.leftChild) {
    result.push(...collectNodes(layout.leftChild, offsetX));
  }
  if (layout.rightChild) {
    const rightChildOffsetX = offsetX + totalWidth - rightWidth;
    result.push(...collectNodes(layout.rightChild, rightChildOffsetX));
  }
  return result;
}

/* ── component ──────────────────────────────────────────────────────── */
export function TreeLab({ snapshot }: { snapshot: TreeSnapshot }) {
  const { nodes, rootId, currentNodeId, traversalOrder, comparingValue } = snapshot;

  if (!rootId || !nodes[rootId]) {
    return (
      <div className="flex min-h-[390px] flex-col justify-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
        <p className="text-center text-sm font-bold text-ink/40">Tree is empty.</p>
      </div>
    );
  }

  const layout = layoutTree(rootId, nodes, 0);
  if (!layout) {
    return (
      <div className="flex min-h-[390px] flex-col justify-center rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
        <p className="text-center text-sm font-bold text-ink/40">Tree is empty.</p>
      </div>
    );
  }

  const depth = getDepth(layout);
  const svgWidth = layout.width + 40; // 20px padding each side
  const svgHeight = depth * (NODE_DIAMETER + V_GAP) + 20;

  const edges = collectEdges(layout, 20); // 20px left padding
  const nodePositions = collectNodes(layout, 20);

  return (
    <div className="flex min-h-[390px] flex-col justify-between rounded-[20px] border border-ink/10 bg-[#eef0e7] p-6 paper-grid">
      <div className="flex flex-1 items-center justify-center overflow-auto py-2">
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          width={Math.min(svgWidth, 800)}
          height={Math.min(svgHeight, 500)}
          className="mx-auto"
          style={{ maxWidth: "100%", height: "auto" }}
        >
          {/* Edges (diagonal lines) */}
          {edges.map((e, i) => (
            <line
              key={`edge-${i}`}
              x1={e.x1}
              y1={e.y1}
              x2={e.x2}
              y2={e.y2}
              stroke="#13211b"
              strokeOpacity={0.25}
              strokeWidth={2}
              strokeLinecap="round"
            />
          ))}

          {/* Nodes */}
          {nodePositions.map(({ id, cx, cy }) => {
            const node = nodes[id];
            if (!node) return null;
            const isCurrent = currentNodeId === id;
            const isRed = node.color === "red";
            const isBlack = node.color === "black";
            const hasKeys = node.keys && node.keys.length > 0;
            const hasPriority = node.priority !== undefined;
            const hasHeight = node.height !== undefined;

            // Fill and stroke colors
            let fill = "#ffffff";
            let stroke = "#13211b";
            let textFill = "#13211b";
            let strokeW = 2;

            if (isCurrent) {
              fill = "#f59e42"; // orange
              stroke = "#13211b";
              textFill = "#ffffff";
              strokeW = 3;
            } else if (isRed) {
              fill = "#fee2e2";
              stroke = "#dc2626";
              textFill = "#b91c1c";
            } else if (isBlack) {
              fill = "#13211b";
              stroke = "#13211b";
              textFill = "#ffffff";
            }

            const labelText = hasKeys
              ? (node.keys ?? []).join(" | ")
              : String(node.value);

            // B-tree nodes are wider
            const nodeW = hasKeys ? Math.max(NODE_DIAMETER, (node.keys?.length ?? 1) * 30 + 10) : NODE_DIAMETER;
            const nodeH = NODE_DIAMETER;

            return (
              <g key={id}>
                {hasKeys ? (
                  <rect
                    x={cx - nodeW / 2}
                    y={cy - nodeH / 2}
                    width={nodeW}
                    height={nodeH}
                    rx={12}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeW}
                  />
                ) : (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={NODE_R}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={strokeW}
                  />
                )}

                {/* Value label */}
                <text
                  x={cx}
                  y={cy + (hasPriority || hasHeight ? -3 : 1)}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fill={textFill}
                  fontSize={LABEL_FONT}
                  fontWeight={800}
                  fontFamily="inherit"
                >
                  {labelText}
                </text>

                {/* Priority label (treaps) */}
                {hasPriority && (
                  <text
                    x={cx}
                    y={cy + 11}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isCurrent ? "#ffffffaa" : "#13211b66"}
                    fontSize={8}
                    fontWeight={700}
                    fontFamily="inherit"
                  >
                    p:{node.priority}
                  </text>
                )}

                {/* Height label (AVL) */}
                {hasHeight && (
                  <text
                    x={cx}
                    y={cy + 11}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill={isCurrent ? "#ffffffaa" : "#13211b66"}
                    fontSize={8}
                    fontWeight={700}
                    fontFamily="inherit"
                  >
                    h:{node.height}
                  </text>
                )}

                {/* Red dot indicator for RBT red nodes */}
                {isRed && !isCurrent && (
                  <circle
                    cx={cx + NODE_R - 4}
                    cy={cy - NODE_R + 4}
                    r={5}
                    fill="#dc2626"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Traversal order / search info */}
      {traversalOrder && traversalOrder.length > 0 && (
        <div className="mt-4 rounded-xl border border-ink/10 bg-white p-3 text-center text-xs font-bold text-ink/65">
          <span className="text-forest uppercase mr-2">Traversal Path:</span>
          {traversalOrder.join(" → ")}
        </div>
      )}

      {comparingValue !== null && comparingValue !== undefined && (
        <div className="mt-2 rounded-xl border border-ink/10 bg-white p-3 text-center text-xs font-bold text-ink/65">
          <span className="text-orange uppercase mr-2">Target:</span>
          {String(comparingValue)}
        </div>
      )}
    </div>
  );
}
