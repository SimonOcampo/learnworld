"use client";

import cytoscape, { type Core } from "cytoscape";
import { useEffect, useRef } from "react";
import type { GraphSnapshot } from "@/lib/engines";
import type { GraphScenario } from "@/lib/types";

export function GraphLab({ scenario, snapshot, weighted }: { scenario: GraphScenario; snapshot: GraphSnapshot; weighted: boolean }) {
  const host = useRef<HTMLDivElement>(null);
  const cy = useRef<Core | null>(null);

  useEffect(() => {
    if (!host.current) return;
    cy.current?.destroy();
    cy.current = cytoscape({
      container: host.current,
      elements: [
        ...scenario.nodes.map((node) => ({ data: { id: node.id, label: node.label } })),
        ...scenario.edges.map((edge) => ({ data: { ...edge, label: weighted ? String(edge.weight) : "" } })),
      ],
      layout: { name: "circle", padding: 48, startAngle: -Math.PI / 2 },
      userZoomingEnabled: false,
      minZoom: .75,
      maxZoom: 1.4,
      style: [
        { selector: "node", style: { "background-color": "#fff", "border-width": 2, "border-color": "#13211b", label: "data(label)", color: "#13211b", "font-size": 14, "font-weight": 800, width: 48, height: 48, "text-valign": "center", "text-halign": "center" } },
        { selector: "edge", style: { width: 3, "line-color": "#b8beb9", "curve-style": "bezier", label: "data(label)", "font-size": 12, "font-weight": 700, "text-background-color": "#f5f1e8", "text-background-opacity": 1, "text-background-padding": 4 } },
        { selector: ".discovered", style: { "background-color": "#e7ffd0", "border-color": "#5a8f2d" } },
        { selector: ".visited", style: { "background-color": "#1f5b45", color: "#fff", "border-color": "#13211b" } },
        { selector: ".current", style: { "background-color": "#ff825c", color: "#13211b", "border-width": 4 } },
        { selector: ".focused", style: { "line-color": "#ff825c", width: 5 } },
      ] as any,
    });
    return () => cy.current?.destroy();
  }, [scenario, weighted]);

  useEffect(() => {
    const graph = cy.current;
    if (!graph) return;
    graph.nodes().removeClass("visited discovered current");
    snapshot.discovered.forEach((id) => graph.getElementById(id).addClass("discovered"));
    snapshot.visited.forEach((id) => graph.getElementById(id).addClass("visited"));
    if (snapshot.current) graph.getElementById(snapshot.current).addClass("current");
  }, [snapshot]);

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[20px] border border-ink/10 bg-[#eef0e7] paper-grid">
      <div ref={host} className="absolute inset-0" aria-label="Interactive graph visualization" />
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 text-[11px] font-bold">
        <span className="pill px-2 py-1">● Current</span><span className="pill px-2 py-1">● Visited</span><span className="pill px-2 py-1">○ Frontier</span>
      </div>
    </div>
  );
}
