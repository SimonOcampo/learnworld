"use client";

import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import { useEffect, useRef } from "react";
import type { TreeSnapshot } from "@/lib/engines";

type Position = { x: number; y: number };

function treeElements(snapshot: TreeSnapshot, nodeTheme: "default" | "dijkstra"): ElementDefinition[] {
  const visitedValues = new Set(snapshot.traversalOrder.map(String));
  const edges = new Set<string>();
  const elements: ElementDefinition[] = Object.values(snapshot.nodes).map((node) => {
    const label = node.keys?.length
      ? node.keys.join(" | ")
      : node.priority !== undefined
        ? `${node.value}\np:${node.priority}`
        : node.height !== undefined
          ? `${node.value}\nh:${node.height}`
          : String(node.value);
    const isVisited = visitedValues.has(String(node.value)) || node.keys?.some((key) => visitedValues.has(String(key)));

    return {
      data: { id: node.id, label },
      classes: [
        node.id === snapshot.currentNodeId ? "current" : "",
        isVisited ? "visited" : "",
        node.color === "red" ? "red" : "",
        node.color === "black" ? "black" : "",
        nodeTheme === "dijkstra" ? "dijkstra-node" : "",
        node.keys?.length ? "multi-key" : "",
      ].filter(Boolean).join(" "),
    };
  });

  for (const node of Object.values(snapshot.nodes)) {
    const childIds = [node.leftId, node.rightId, ...(node.childrenIds ?? [])].filter((id): id is string => Boolean(id));
    for (const childId of childIds) {
      if (!snapshot.nodes[childId]) continue;
      const id = `${node.id}-${childId}`;
      if (edges.has(id)) continue;
      edges.add(id);
      elements.push({ data: { id, source: node.id, target: childId } });
    }
  }

  return elements;
}

export function TreeLab({ snapshot, layoutKey, nodeTheme = "default" }: { snapshot: TreeSnapshot; layoutKey?: string; nodeTheme?: "default" | "dijkstra" }) {
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);
  const positions = useRef<Record<string, Position>>({});
  const hasLaidOut = useRef(false);

  useEffect(() => {
    if (!host.current) return;

    const graph = cytoscape({
      container: host.current,
      userZoomingEnabled: true,
      minZoom: 0.5,
      maxZoom: 1.8,
      autoungrabify: false,
      style: [
        { selector: "node", style: { "background-color": "#fff", "border-width": 2, "border-color": "#13211b", label: "data(label)", color: "#13211b", "font-size": 13, "font-weight": 800, width: 48, height: 48, shape: "ellipse", "text-wrap": "wrap", "text-max-width": 64, "text-valign": "center", "text-halign": "center", "line-height": 1.1, "overlay-opacity": 0, cursor: "grab" } },
        { selector: "edge", style: { width: 3, "line-color": "#b8beb9", "curve-style": "bezier", "target-arrow-shape": "none", "overlay-opacity": 0 } },
        { selector: ".visited", style: { "background-color": "#e7ffd0", "border-color": "#5a8f2d" } },
        { selector: ".current", style: { "background-color": "#ff825c", color: "#13211b", "border-width": 4 } },
        { selector: ".red", style: { "background-color": "#fee2e2", "border-color": "#dc2626", color: "#b91c1c" } },
        { selector: ".black", style: { "background-color": "#13211b", "border-color": "#13211b", color: "#fff" } },
        { selector: ".dijkstra-node", style: { "background-color": "#1f5b45", "border-color": "#13211b", color: "#fff", width: 48, height: 48, shape: "ellipse", "font-size": 14 } },
        { selector: ".current.red, .current.black", style: { "background-color": "#ff825c", "border-color": "#13211b", color: "#13211b" } },
        { selector: ".current.dijkstra-node", style: { "background-color": "#ff825c", "border-color": "#13211b", color: "#13211b" } },
        { selector: ".multi-key", style: { shape: "round-rectangle", width: "label", height: 48, padding: "0 13px", "text-max-width": 150 } },
      ] as any,
    });

    graph.on("dragfree", "node", (event) => {
      const node = event.target;
      positions.current[node.id()] = { ...node.position() };
    });
    cy.current = graph;
    return () => graph.destroy();
  }, []);

  useEffect(() => {
    positions.current = {};
    hasLaidOut.current = false;
  }, [layoutKey]);

  useEffect(() => {
    const graph = cy.current;
    if (!graph) return;

    graph.elements().remove();
    graph.add(treeElements(snapshot, nodeTheme));

    const savedPositions = positions.current;
    const allNodesHavePositions = graph.nodes().length > 0 && graph.nodes().toArray().every((node) => Boolean(savedPositions[node.id()]));
    if (!hasLaidOut.current || !allNodesHavePositions) {
      graph.layout({ name: "breadthfirst", directed: true, roots: snapshot.rootId ? [snapshot.rootId] : undefined, padding: 54, spacingFactor: 1.3, animate: false }).run();
      hasLaidOut.current = true;
    }
    graph.nodes().forEach((node) => {
      const saved = savedPositions[node.id()];
      if (saved) node.position(saved);
    });
    graph.fit(graph.elements(), 42);
  }, [snapshot, nodeTheme]);

  const isEmpty = !snapshot.rootId || !snapshot.nodes[snapshot.rootId];

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[20px] border border-ink/10 bg-[#eef0e7] paper-grid">
      <div ref={host} className="absolute inset-0" aria-label="Interactive tree visualization. Drag nodes to arrange the tree." />
      {isEmpty && <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm font-bold text-ink/40">Tree is empty.</p>}
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[11px] font-bold">
        <span className="pill px-2 py-1">Drag nodes to arrange</span>
        <span className="pill px-2 py-1">Orange: current</span>
        <span className="pill px-2 py-1">Green: visited</span>
      </div>
      {snapshot.traversalOrder.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 right-3 max-w-[60%] rounded-xl border border-ink/10 bg-white/95 px-3 py-2 text-right text-xs font-bold text-ink/65">
          <span className="mr-2 uppercase text-forest">Path:</span>{snapshot.traversalOrder.join(" → ")}
        </div>
      )}
    </div>
  );
}
