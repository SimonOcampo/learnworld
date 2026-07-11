"use client";

import cytoscape, { type Core, type ElementDefinition } from "cytoscape";
import { useEffect, useRef } from "react";
import type { TrieSnapshot } from "@/lib/engines";

type Position = { x: number; y: number };

function trieElements(snapshot: TrieSnapshot): ElementDefinition[] {
  const elements: ElementDefinition[] = Object.values(snapshot.nodes).map((node) => ({
    data: { id: node.id, label: node.char || "root" },
    classes: [node.id === snapshot.currentNodeId ? "current" : "", node.isEndOfWord ? "terminal" : ""].filter(Boolean).join(" "),
  }));
  for (const node of Object.values(snapshot.nodes)) {
    for (const childId of Object.values(node.children)) {
      elements.push({ data: { id: `${node.id}-${childId}`, source: node.id, target: childId } });
    }
  }
  return elements;
}

export function TrieLab({ snapshot, layoutKey }: { snapshot: TrieSnapshot; layoutKey?: string }) {
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
        { selector: "node", style: { "background-color": "#fff", "border-width": 2, "border-color": "#13211b", label: "data(label)", color: "#13211b", "font-size": 13, "font-weight": 800, width: 48, height: 48, "text-valign": "center", "text-halign": "center", "overlay-opacity": 0, cursor: "grab" } },
        { selector: "edge", style: { width: 3, "line-color": "#b8beb9", "curve-style": "bezier", "overlay-opacity": 0 } },
        { selector: ".terminal", style: { "background-color": "#e7ffd0", "border-color": "#5a8f2d" } },
        { selector: ".current", style: { "background-color": "#ff825c", color: "#13211b", "border-width": 4 } },
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
    graph.add(trieElements(snapshot));
    const savedPositions = positions.current;
    const allNodesHavePositions = graph.nodes().length > 0 && graph.nodes().toArray().every((node) => Boolean(savedPositions[node.id()]));
    if (!hasLaidOut.current || !allNodesHavePositions) {
      graph.layout({ name: "breadthfirst", directed: true, roots: [snapshot.rootId], padding: 54, spacingFactor: 1.3, animate: false }).run();
      hasLaidOut.current = true;
    }
    graph.nodes().forEach((node) => {
      const saved = savedPositions[node.id()];
      if (saved) node.position(saved);
    });
    graph.fit(graph.elements(), 42);
  }, [snapshot]);

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[20px] border border-ink/10 bg-[#eef0e7] paper-grid">
      <div ref={host} className="absolute inset-0" aria-label="Interactive trie visualization. Drag nodes to arrange the trie." />
      <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-2 text-[11px] font-bold">
        <span className="pill px-2 py-1">Drag nodes to arrange</span>
        <span className="pill px-2 py-1">Orange: current</span>
        <span className="pill px-2 py-1">Green: complete word</span>
      </div>
      {snapshot.currentWord && <div className="pointer-events-none absolute bottom-3 right-3 rounded-xl border border-ink/10 bg-white/95 px-3 py-2 text-xs font-bold text-ink/65"><span className="mr-2 uppercase text-forest">Path:</span>&quot;{snapshot.currentWord}&quot;</div>}
    </div>
  );
}
