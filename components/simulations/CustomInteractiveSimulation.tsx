"use client";

import { useMemo, useState, useRef } from "react";
import { customInteractiveConfigSchema, type CustomInteractiveConfig } from "@/lib/simulations/custom-interactive";

type Values = Record<string, number>;
type HistoryEntry = { values: Values; feedback: string; choice: string };

const initialValues = (config: CustomInteractiveConfig): Values =>
  Object.fromEntries(config.variables.map((variable) => [variable.id, variable.initial]));
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const formatText = (text: string, currentValues: Values): string => {
  const replaceFn = (match: string, expression: string) => {
    const trimmed = expression.trim();
    if (trimmed in currentValues) {
      return String(currentValues[trimmed]);
    }
    const calcRegex = /^([a-z0-9-]+)\s*([-+*])\s*([0-9.]+)/i;
    const calcMatch = trimmed.match(calcRegex);
    if (calcMatch) {
      const [, varId, op, numStr] = calcMatch;
      if (varId in currentValues) {
        const val = currentValues[varId];
        const num = parseFloat(numStr);
        if (op === "+") return String(parseFloat((val + num).toFixed(4)));
        if (op === "-") return String(parseFloat((val - num).toFixed(4)));
        if (op === "*") return String(parseFloat((val * num).toFixed(4)));
      }
    }
    return match;
  };
  return text.replace(/\{([^}]+)\}/g, replaceFn).replace(/\[([^\]]+)\]/g, replaceFn);
};

export function CustomInteractiveSimulation({ config: rawConfig, onComplete }: { config: unknown; onComplete: () => void }) {
  const parsed = useMemo(() => customInteractiveConfigSchema.safeParse(rawConfig), [rawConfig]);
  if (!parsed.success) {
    return (
      <p className="rounded-2xl bg-orange/20 p-5 font-bold">
        This custom simulation has an invalid configuration. Generate it again from the workshop.
      </p>
    );
  }
  return <InteractiveActivity config={parsed.data} onComplete={onComplete} />;
}

function InteractiveActivity({ config, onComplete }: { config: CustomInteractiveConfig; onComplete: () => void }) {
  const defaults = useMemo(() => initialValues(config), [config]);
  const [starting, setStarting] = useState<Values>(defaults);
  const [values, setValues] = useState<Values>(defaults);
  const [stage, setStage] = useState(0);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [started, setStarted] = useState(false);
  const complete = stage >= config.stages.length;

  function randomize() {
    const next = { ...starting };
    for (const variable of config.variables) {
      const stepsCount = Math.floor((variable.max - variable.min) / variable.step);
      const randomStepIdx = Math.floor(Math.random() * (stepsCount + 1));
      const randomVal = parseFloat((variable.min + randomStepIdx * variable.step).toFixed(4));
      next[variable.id] = clamp(randomVal, variable.min, variable.max);
    }
    setStarting(next);
    setValues(next);
    setStage(0);
    setHistory([]);
    setStarted(false);
  }

  function changeStart(id: string, value: number) {
    const variable = config.variables.find((item) => item.id === id);
    if (!variable) return;
    const next = { ...starting, [id]: clamp(value, variable.min, variable.max) };
    setStarting(next);
    setValues(next);
    setStage(0);
    setHistory([]);
    setStarted(false);
  }

  function choose(choice: CustomInteractiveConfig["stages"][number]["choices"][number]) {
    const before = values;
    const next = { ...values };
    for (const effect of choice.effects) {
      const variable = config.variables.find((item) => item.id === effect.variableId);
      if (variable) {
        next[effect.variableId] = clamp(
          (next[effect.variableId] ?? variable.initial) + effect.delta,
          variable.min,
          variable.max
        );
      }
    }
    setHistory((items) => [...items, { values: before, feedback: choice.feedback, choice: choice.label }]);
    setValues(next);
    const nextStage = stage + 1;
    setStage(nextStage);
    if (nextStage >= config.stages.length) onComplete();
  }

  function back() {
    const previous = history.at(-1);
    if (!previous) return;
    setValues(previous.values);
    setHistory((items) => items.slice(0, -1));
    setStage((value) => Math.max(0, value - 1));
  }

  function reset() {
    setValues(starting);
    setStage(0);
    setHistory([]);
    setStarted(false);
  }

  const active = config.stages[stage];
  const latest = history.at(-1);

  // Render the concept-specific visualization panel
  const renderVisualizer = () => {
    switch (config.family) {
      case "linear-regression":
      case "regression":
        return (
          <LinearRegressionLab
            variables={config.variables}
            values={values}
            starting={starting}
            setStarting={setStarting}
            setValues={setValues}
          />
        );
      case "sorting":
      case "sequence":
        return <SequenceSortingLab values={values} variables={config.variables} />;
      case "grid":
      case "dp-grid":
        return <GridHeatmapLab values={values} variables={config.variables} />;
      case "tree":
      case "decision-tree":
        return <DecisionTreeLab stages={config.stages} stage={stage} history={history} />;
      case "graph":
        return <GraphLab />;
      default:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
              {config.variables.map((variable) => (
                <CircularGauge
                  key={variable.id}
                  label={variable.label}
                  value={values[variable.id] ?? variable.initial}
                  min={variable.min}
                  max={variable.max}
                  description={variable.description}
                />
              ))}
            </div>
            <SimulationHistoryGraph variables={config.variables} history={history} currentValues={values} />
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Concept Header */}
      <section className="rounded-3xl border-2 border-ink bg-cream p-5 shadow-[4px_4px_0_#13211b]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <span className="rounded-full bg-forest text-white px-3 py-1 text-[10px] font-black uppercase tracking-wider">
              Interactive Lab · {config.family.replaceAll("-", " ")}
            </span>
            <h4 className="display mt-2 text-2xl font-black text-ink">Explore & Simulate Concept</h4>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto">
            <span className="rounded-2xl border border-ink/15 bg-white px-3 py-1.5 text-xs font-black">
              Decision {stage} of {config.stages.length}
            </span>
          </div>
        </div>
      </section>

      {/* Main Simulation Workspace Grid */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Adjustable starting state & Control Panel */}
        <aside className="space-y-4">
          <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#13211b]">
            <div className="flex items-center justify-between">
              <p className="text-xs font-black uppercase text-forest">Adjust Starting State</p>
              <button
                onClick={randomize}
                className="rounded-full bg-cream border border-ink/20 px-2.5 py-0.5 text-[10px] font-black hover:bg-lime transition"
              >
                Randomize
              </button>
            </div>
            <div className="mt-4 space-y-4">
              {config.variables.map((variable) => (
                <label key={variable.id} className="block rounded-xl bg-cream border border-ink/5 p-3">
                  <span className="flex items-center justify-between text-xs font-black text-ink">
                    <span>{variable.label}</span>
                    <span className="rounded-md bg-ink px-1.5 py-0.5 text-[10px] text-white">
                      {starting[variable.id]}
                    </span>
                  </span>
                  <input
                    className="mt-2 w-full accent-forest cursor-pointer"
                    type="range"
                    min={variable.min}
                    max={variable.max}
                    step={variable.step}
                    value={starting[variable.id]}
                    onChange={(event) => changeStart(variable.id, Number(event.target.value))}
                  />
                  <span className="mt-1 block text-[9px] text-ink/50 leading-tight">
                    {variable.description}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Quick Stats list / live values status */}
          <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#13211b]">
            <p className="text-xs font-black uppercase text-forest">Live Status</p>
            <div className="mt-3 space-y-3">
              {config.variables.map((variable) => {
                const percent = ((values[variable.id] - variable.min) / (variable.max - variable.min)) * 100;
                return (
                  <div key={variable.id} className="text-xs">
                    <div className="flex justify-between font-black text-ink">
                      <span>{variable.label}</span>
                      <span>{values[variable.id]}</span>
                    </div>
                    <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-cream border border-ink/5">
                      <div
                        className="h-full bg-forest transition-all duration-300"
                        style={{ width: `${clamp(percent, 0, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button
                disabled={!history.length}
                onClick={back}
                className="rounded-xl border-2 border-ink bg-white py-2 text-xs font-black transition hover:bg-cream disabled:opacity-40"
              >
                ← Back
              </button>
              <button
                onClick={reset}
                className="rounded-xl border-2 border-ink bg-orange text-white py-2 text-xs font-black transition hover:bg-orange/90"
              >
                Reset
              </button>
            </div>
          </div>
        </aside>

        {/* Visual Lab area and Decisions */}
        <main className="space-y-6 min-w-0">
          {/* Interactive Graphic Layer */}
          {renderVisualizer()}

          {/* Decision Stage */}
          <div className="rounded-3xl border-2 border-ink bg-white p-6 shadow-[5px_5px_0_#13211b]">
            {!started ? (
              <div className="text-center py-6">
                <span className="rounded-full bg-orange/15 text-orange px-3 py-1 text-xs font-black uppercase">
                  Setup Phase
                </span>
                <h4 className="display mt-4 text-3xl font-black text-ink">Ready to explore?</h4>
                <p className="mt-3 text-sm leading-relaxed text-ink/70 max-w-md mx-auto">
                  Adjust the starting parameters on the left, or randomize them to test a different scenario. Once you are ready, click below to begin the simulation.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    onClick={randomize}
                    className="rounded-xl border-2 border-ink bg-white px-4 py-2.5 text-xs font-black transition hover:bg-cream"
                  >
                    Randomize Parameters
                  </button>
                  <button
                    onClick={() => setStarted(true)}
                    className="rounded-xl border-2 border-ink bg-lime px-6 py-2.5 text-xs font-black transition hover:bg-lime/90 hover:shadow-[3px_3px_0_#13211b]"
                  >
                    Start Simulation
                  </button>
                </div>
              </div>
            ) : complete ? (
              <div className="text-center py-6">
                <span className="rounded-full bg-lime text-forest px-3 py-1 text-xs font-black uppercase">
                  Simulation Finished
                </span>
                <h4 className="display mt-4 text-3xl font-black text-ink">All Decisions Explored</h4>
                <p className="mt-2 text-sm text-ink/65 max-w-md mx-auto">
                  Adjust the starting sliders to test a new scenario, or step backward to review specific outcomes.
                </p>
              </div>
            ) : (
              <div>
                <span className="text-xs font-black uppercase text-forest">
                  Decision {stage + 1} of {config.stages.length}
                </span>
                
                {/* Active parameters tags */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {config.variables.map((v) => (
                    <span key={v.id} className="inline-flex items-center rounded-full bg-cream border border-ink/10 px-2.5 py-1 text-[10px] font-black text-ink/65 select-none">
                      {v.label}: <strong className="ml-1 text-forest">{values[v.id]}</strong>
                    </span>
                  ))}
                </div>

                <h4 className="display mt-4 text-3xl font-black text-ink">{formatText(active.title, values)}</h4>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{formatText(active.description, values)}</p>
                
                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {active.choices.map((choice) => (
                    <button
                      key={choice.label}
                      onClick={() => choose(choice)}
                      className="rounded-2xl border-2 border-ink bg-cream p-4 text-left text-sm font-black transition duration-200 hover:-translate-y-0.5 hover:border-ink hover:bg-lime hover:shadow-[3px_3px_0_#13211b]"
                    >
                      {formatText(choice.label, values)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {started && latest && (
              <div aria-live="polite" className="mt-6 rounded-2xl bg-ink p-4 text-white shadow-inner">
                <span className="text-[10px] font-black uppercase text-lime">
                  Result of choice: “{formatText(latest.choice, values)}”
                </span>
                <p className="mt-2 text-sm font-medium leading-relaxed">{formatText(latest.feedback, values)}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ----------------- Concept-Specific Visual Labs -----------------

interface Point {
  id: number;
  x: number;
  y: number;
}

// 1. Linear Regression Visualizer
function LinearRegressionLab({
  variables,
  values,
  starting,
  setStarting,
  setValues,
}: {
  variables: CustomInteractiveConfig["variables"];
  values: Values;
  starting: Values;
  setStarting: (v: Values) => void;
  setValues: (v: Values) => void;
}) {
  const slopeVar = variables.find((v) => ["slope", "m", "w", "weight", "coef"].includes(v.id)) || variables[0];
  const interceptVar =
    variables.find((v) => ["intercept", "c", "b", "bias", "offset"].includes(v.id)) || variables[1] || variables[0];

  const m = values[slopeVar.id] ?? 0;
  const c = values[interceptVar.id] ?? 0;

  const [points, setPoints] = useState<Point[]>([
    { id: 1, x: -6, y: -5 },
    { id: 2, x: -3, y: -2 },
    { id: 3, x: 0, y: 1 },
    { id: 4, x: 2, y: 2 },
    { id: 5, x: 5, y: 5 },
    { id: 6, x: 8, y: 7 },
  ]);

  const [draggedId, setDraggedId] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const svgW = 500;
  const svgH = 320;
  const margin = 40;

  const toSvgX = (x: number) => margin + ((x + 10) / 20) * (svgW - 2 * margin);
  const toSvgY = (y: number) => svgH - margin - ((y + 10) / 20) * (svgH - 2 * margin);

  const fromSvgX = (svgX: number) => {
    const raw = -10 + ((svgX - margin) / (svgW - 2 * margin)) * 20;
    return Math.min(10, Math.max(-10, parseFloat(raw.toFixed(1))));
  };
  const fromSvgY = (svgY: number) => {
    const raw = -10 + ((svgH - margin - svgY) / (svgH - 2 * margin)) * 20;
    return Math.min(10, Math.max(-10, parseFloat(raw.toFixed(1))));
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedId !== null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const svgX = (mouseX / rect.width) * svgW;
    const svgY = (mouseY / rect.height) * svgH;

    const clickedPoint = points.find((p) => {
      const px = toSvgX(p.x);
      const py = toSvgY(p.y);
      return Math.hypot(px - svgX, py - svgY) < 12;
    });

    if (clickedPoint) {
      setPoints(points.filter((p) => p.id !== clickedPoint.id));
    } else {
      const newPoint: Point = {
        id: Date.now(),
        x: fromSvgX(svgX),
        y: fromSvgY(svgY),
      };
      setPoints([...points, newPoint]);
    }
  };

  const handlePointMouseDown = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggedId(id);
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (draggedId === null || !svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const svgX = (mouseX / rect.width) * svgW;
    const svgY = (mouseY / rect.height) * svgH;

    setPoints(points.map((p) => (p.id === draggedId ? { ...p, x: fromSvgX(svgX), y: fromSvgY(svgY) } : p)));
  };

  const handleMouseUp = () => {
    setDraggedId(null);
  };

  const n = points.length;
  let mse = 0;
  let rSquared = 1;

  if (n > 0) {
    const squaredErrors = points.map((p) => {
      const predY = m * p.x + c;
      return (p.y - predY) ** 2;
    });
    mse = squaredErrors.reduce((sum, err) => sum + err, 0) / n;

    const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
    const ssTot = points.reduce((sum, p) => sum + (p.y - meanY) ** 2, 0);
    const ssRes = squaredErrors.reduce((sum, err) => sum + err, 0);
    rSquared = ssTot > 0 ? 1 - ssRes / ssTot : 1;
  }

  const autoFit = () => {
    if (points.length < 2) return;
    const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
    const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
    const num = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0);
    const den = points.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0);
    if (den === 0) return;
    const optM = num / den;
    const optC = meanY - optM * meanX;

    const nextStart = { ...starting };
    const nextValues = { ...values };

    const roundedM = parseFloat(optM.toFixed(2));
    const roundedC = parseFloat(optC.toFixed(2));

    nextStart[slopeVar.id] = Math.min(slopeVar.max, Math.max(slopeVar.min, roundedM));
    nextValues[slopeVar.id] = Math.min(slopeVar.max, Math.max(slopeVar.min, roundedM));

    if (interceptVar.id !== slopeVar.id) {
      nextStart[interceptVar.id] = Math.min(interceptVar.max, Math.max(interceptVar.min, roundedC));
      nextValues[interceptVar.id] = Math.min(interceptVar.max, Math.max(interceptVar.min, roundedC));
    }

    setStarting(nextStart);
    setValues(nextValues);
  };

  const lineY1 = m * -10 + c;
  const lineY2 = m * 10 + c;

  return (
    <div className="flex flex-col gap-4 lg:flex-row">
      <div className="relative flex-1 rounded-3xl border-2 border-ink bg-white p-2 shadow-[4px_4px_0_#13211b]">
        <div className="absolute top-4 left-4 rounded-xl bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink/70">
          Click plot to add/delete. Drag orange dots.
        </div>
        <svg
          ref={svgRef}
          viewBox={`0 0 ${svgW} ${svgH}`}
          onMouseMove={handleSvgMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleSvgMouseDown}
          className="w-full cursor-crosshair select-none rounded-2xl"
        >
          {Array.from({ length: 21 }).map((_, i) => {
            const val = -10 + i;
            const sx = toSvgX(val);
            const sy = toSvgY(val);
            return (
              <g key={i}>
                <line
                  x1={sx}
                  y1={margin}
                  x2={sx}
                  y2={svgH - margin}
                  stroke={val === 0 ? "#13211b" : "#eef0e7"}
                  strokeWidth={val === 0 ? 2 : 1}
                />
                <line
                  x1={margin}
                  y1={sy}
                  x2={svgW - margin}
                  y2={sy}
                  stroke={val === 0 ? "#13211b" : "#eef0e7"}
                  strokeWidth={val === 0 ? 2 : 1}
                />
                {val !== 0 && val % 4 === 0 && (
                  <>
                    <text x={sx} y={svgH - margin + 15} textAnchor="middle" className="text-[10px] font-bold fill-ink/40">
                      {val}
                    </text>
                    <text x={margin - 15} y={sy + 3} textAnchor="end" className="text-[10px] font-bold fill-ink/40">
                      {val}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {points.map((p) => {
            const lineY = m * p.x + c;
            return (
              <line
                key={`res-${p.id}`}
                x1={toSvgX(p.x)}
                y1={toSvgY(p.y)}
                x2={toSvgX(p.x)}
                y2={toSvgY(lineY)}
                stroke="#f97316"
                strokeWidth={1.5}
                strokeDasharray="2 2"
              />
            );
          })}

          <line x1={toSvgX(-10)} y1={toSvgY(lineY1)} x2={toSvgX(10)} y2={toSvgY(lineY2)} stroke="#315c45" strokeWidth={3} />

          {points.map((p) => (
            <circle
              key={p.id}
              cx={toSvgX(p.x)}
              cy={toSvgY(p.y)}
              r={7}
              fill="#f97316"
              stroke="#13211b"
              strokeWidth={2}
              onMouseDown={(e) => handlePointMouseDown(p.id, e)}
              className="cursor-grab hover:fill-orange-600 transition-colors"
            />
          ))}
        </svg>
      </div>

      <div className="w-full lg:w-[220px] flex flex-col gap-4 justify-between">
        <div className="rounded-2xl border-2 border-ink bg-lime p-4 shadow-[3px_3px_0_#13211b]">
          <span className="text-[9px] font-black uppercase text-forest">Fitted Equation</span>
          <div className="mt-1 text-base font-black text-ink">
            y = {m >= 0 ? "" : "-"}{Math.abs(m).toFixed(2)}x {c >= 0 ? "+" : "-"}{" "}{Math.abs(c).toFixed(2)}
          </div>
        </div>

        <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-[3px_3px_0_#13211b] flex-1 flex flex-col justify-between">
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs font-black text-ink">
                <span>MSE (Error)</span>
                <span className="text-orange">{mse.toFixed(2)}</span>
              </div>
              <div className="mt-1 h-2 w-full bg-cream border border-ink/5 rounded-full overflow-hidden">
                <div className="h-full bg-orange transition-all" style={{ width: `${Math.min(100, mse * 5)}%` }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-black text-ink">
                <span>R² (Fit Quality)</span>
                <span className="text-forest">{rSquared.toFixed(2)}</span>
              </div>
              <div className="mt-1 h-2 w-full bg-cream border border-ink/5 rounded-full overflow-hidden">
                <div className="h-full bg-forest transition-all" style={{ width: `${Math.max(0, Math.min(100, rSquared * 100))}%` }} />
              </div>
            </div>
          </div>

          <button
            onClick={autoFit}
            disabled={points.length < 2}
            className="btn btn-primary mt-4 w-full py-2 text-xs font-black"
          >
            Auto-fit Least Squares
          </button>
        </div>
      </div>
    </div>
  );
}

// 2. Sequence & Sorting Visualizer
function SequenceSortingLab({ values, variables }: { values: Values; variables: CustomInteractiveConfig["variables"] }) {
  const [sequence, setSequence] = useState<number[]>([18, 45, 68, 25, 87, 52, 35, 78]);

  const shuffle = () => {
    setSequence([...sequence].sort(() => Math.random() - 0.5));
  };

  const handleBarClick = (index: number) => {
    const next = [...sequence];
    next[index] = (next[index] + 10) % 100 || 10;
    setSequence(next);
  };

  const pointerVars = variables.filter((v) => ["index", "pointer", "cursor", "target", "low", "high", "mid", "i", "j"].includes(v.id));

  return (
    <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#13211b]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-black uppercase text-forest">Interactive Sequence Heights</span>
        <button
          onClick={shuffle}
          className="rounded-full bg-cream border border-ink/20 px-3 py-1 text-xs font-black hover:bg-lime transition"
        >
          Shuffle Array
        </button>
      </div>

      <div className="mt-6 flex h-40 items-end justify-center gap-2 border-b-2 border-ink pb-2">
        {sequence.map((val, idx) => {
          const height = `${val}%`;
          const activePointers = pointerVars.filter((v) => Math.round(values[v.id]) === idx);
          const isPointerActive = activePointers.length > 0;

          return (
            <div key={idx} className="group relative flex flex-1 flex-col items-center">
              <span className="mb-1 text-[10px] font-bold text-ink/50 group-hover:text-ink">{val}</span>
              <button
                onClick={() => handleBarClick(idx)}
                className={`w-full rounded-t-md border-x-2 border-t-2 border-ink transition-all ${
                  isPointerActive ? "bg-orange hover:bg-orange/80" : "bg-forest/80 hover:bg-forest"
                }`}
                style={{ height }}
              />
              <span className="mt-1 text-[9px] font-bold text-ink/40">{idx}</span>

              {isPointerActive && (
                <div className="absolute -bottom-8 flex flex-col items-center">
                  <div className="h-0 w-0 border-x-[4px] border-b-[6px] border-x-transparent border-b-orange" />
                  <span className="text-[7px] font-black bg-orange text-ink px-1 rounded mt-0.5 whitespace-nowrap">
                    {activePointers.map((p) => p.label).join(",")}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-8 text-center text-xs text-ink/40 font-bold">
        Click bars to increment values. Active pointer values from sliders highlight indices.
      </div>
    </div>
  );
}

// 3. Grid & Heatmap Visualizer
function GridHeatmapLab({ values, variables }: { values: Values; variables: CustomInteractiveConfig["variables"] }) {
  const [grid, setGrid] = useState<number[]>(() => Array.from({ length: 25 }, () => Math.floor(Math.random() * 5)));

  const handleCellClick = (idx: number) => {
    const next = [...grid];
    next[idx] = (next[idx] + 1) % 5;
    setGrid(next);
  };

  const xVar = variables.find((v) => ["x", "col", "column", "width"].includes(v.id));
  const yVar = variables.find((v) => ["y", "row", "height"].includes(v.id));

  const playerIdx =
    xVar && yVar
      ? Math.round(values[yVar.id] ?? 0) * 5 + Math.round(values[xVar.id] ?? 0)
      : null;

  const colors = [
    "bg-cream hover:bg-cream/80",
    "bg-lime/20 hover:bg-lime/30",
    "bg-lime/55 hover:bg-lime/75",
    "bg-lime hover:bg-lime/90",
    "bg-forest text-white hover:bg-forest/90",
  ];

  return (
    <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#13211b] flex flex-col items-center">
      <span className="text-xs font-black uppercase text-forest self-start mb-4">Interactive 2D Matrix Grid</span>

      <div className="grid grid-cols-5 gap-1.5 w-56 h-56 border-2 border-ink p-1.5 rounded-2xl bg-[#eef0e7]">
        {grid.map((val, idx) => {
          const isPlayer = idx === playerIdx;
          return (
            <button
              key={idx}
              onClick={() => handleCellClick(idx)}
              className={`relative flex items-center justify-center border border-ink/10 rounded-lg text-xs font-black transition-all ${colors[val]}`}
            >
              {isPlayer ? "🤖" : val}
            </button>
          );
        })}
      </div>
      <div className="mt-4 text-center text-xs text-ink/40 font-bold">
        Click cells to increment heatmap intensity. X & Y position state variables locate character (🤖).
      </div>
    </div>
  );
}

// 4. Tree & Decision Tree Visualizer
function DecisionTreeLab({
  stages,
  stage,
  history,
}: {
  stages: CustomInteractiveConfig["stages"];
  stage: number;
  history: HistoryEntry[];
}) {
  return (
    <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#13211b]">
      <span className="text-xs font-black uppercase text-forest mb-4 block">Branching Choice Path Tree</span>
      <div className="space-y-5 relative before:absolute before:left-[17px] before:top-2 before:bottom-2 before:w-[2px] before:bg-ink/10">
        {stages.map((stg, idx) => {
          const isPast = idx < stage;
          const isActive = idx === stage;
          const hist = history[idx];

          return (
            <div key={idx} className="flex gap-4 relative items-start transition-all">
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-ink font-black text-xs z-10 transition-all ${
                  isPast ? "bg-lime text-ink" : isActive ? "bg-orange text-white ring-4 ring-orange/15" : "bg-cream text-ink/30"
                }`}
              >
                {isPast ? "✓" : idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className={`font-black text-sm ${isActive ? "text-ink" : "text-ink/60"}`}>{stg.title}</h5>
                {isActive && <p className="mt-1 text-xs text-ink/70 leading-relaxed">{stg.description}</p>}
                {isPast && hist && (
                  <div className="mt-1 inline-flex items-center gap-1.5 rounded-lg bg-cream px-2 py-0.5 text-xs border border-ink/5 font-semibold text-ink/60">
                    <span className="font-extrabold text-orange">Chose:</span>
                    <span>{hist.choice}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 5. Network Graph Visualizer
function GraphLab() {
  const [hovered, setHovered] = useState<string | null>(null);

  const nodes = [
    { id: "A", cx: 120, cy: 55 },
    { id: "B", cx: 190, cy: 105 },
    { id: "C", cx: 165, cy: 185 },
    { id: "D", cx: 75, cy: 185 },
    { id: "E", cx: 50, cy: 105 },
  ];

  const edges = [
    { from: "A", to: "B" },
    { from: "B", to: "C" },
    { from: "C", to: "D" },
    { from: "D", to: "E" },
    { from: "E", to: "A" },
    { from: "A", to: "C" },
    { from: "B", to: "D" },
  ];

  return (
    <div className="rounded-3xl border-2 border-ink bg-white p-5 shadow-[4px_4px_0_#13211b] flex flex-col items-center">
      <span className="text-xs font-black uppercase text-forest self-start mb-3">State-mapped Node Graph</span>

      <svg viewBox="0 0 240 230" className="w-full max-w-[240px] h-auto select-none">
        {edges.map((e, idx) => {
          const fromNode = nodes.find((n) => n.id === e.from)!;
          const toNode = nodes.find((n) => n.id === e.to)!;
          const isHovered = hovered === e.from || hovered === e.to;
          return (
            <line
              key={idx}
              x1={fromNode.cx}
              y1={fromNode.cy}
              x2={toNode.cx}
              y2={toNode.cy}
              stroke={isHovered ? "#f97316" : "#13211b"}
              strokeWidth={isHovered ? 2 : 1}
              strokeDasharray={isHovered ? "none" : "2 2"}
              className="transition-all"
            />
          );
        })}

        {nodes.map((n) => {
          const isHovered = hovered === n.id;
          return (
            <g
              key={n.id}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              className="cursor-pointer"
            >
              <circle
                cx={n.cx}
                cy={n.cy}
                r={15}
                fill={isHovered ? "#315c45" : "#eef0e7"}
                stroke="#13211b"
                strokeWidth={2}
                className="transition-all"
              />
              <text
                x={n.cx}
                y={n.cy + 4}
                textAnchor="middle"
                className={`text-[10px] font-black transition-all ${isHovered ? "fill-white" : "fill-ink"}`}
              >
                {n.id}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="mt-2 text-center text-xs text-ink/40 font-bold">
        Hover nodes to trace adjacent links. Demonstrates path steps and topological logic.
      </div>
    </div>
  );
}

// ----------------- Default Visual Dashboard Modules -----------------

// Circular Gauge Indicator
function CircularGauge({
  label,
  value,
  min,
  max,
  description,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  description: string;
}) {
  const radius = 35;
  const stroke = 5;
  const normalizedValue = max > min ? (value - min) / (max - min) : 0.5;
  const clampVal = Math.max(0, Math.min(1, normalizedValue));
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - clampVal * circumference;

  return (
    <div className="flex flex-col items-center rounded-2xl border border-ink/10 bg-white p-3 shadow-[2px_2px_0_#13211b] transition hover:-translate-y-0.5">
      <div className="relative flex h-20 w-20 items-center justify-center">
        <svg className="h-full w-full rotate-[-90deg]">
          <circle cx="40" cy="40" r={radius} fill="transparent" stroke="#eef0e7" strokeWidth={stroke} />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="transparent"
            stroke="#315c45"
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-sm font-black text-ink">{value}</span>
        </div>
      </div>
      <span className="mt-2 text-xs font-black text-ink">{label}</span>
      <span className="mt-1 text-center text-[9px] text-ink/50 leading-tight line-clamp-2">{description}</span>
    </div>
  );
}

// Simulation History Line Chart
function SimulationHistoryGraph({
  variables,
  history,
  currentValues,
}: {
  variables: CustomInteractiveConfig["variables"];
  history: HistoryEntry[];
  currentValues: Values;
}) {
  const steps = [...history.map((h) => h.values), currentValues];
  const totalSteps = steps.length;
  if (totalSteps < 2) return null;

  const svgW = 440;
  const svgH = 130;
  const paddingX = 40;
  const paddingY = 15;

  const getX = (stepIndex: number) => paddingX + (stepIndex / (totalSteps - 1)) * (svgW - 2 * paddingX);

  const getY = (value: number, min: number, max: number) => {
    const percent = max > min ? (value - min) / (max - min) : 0.5;
    const clampP = Math.max(0, Math.min(1, percent));
    return svgH - paddingY - clampP * (svgH - 2 * paddingY);
  };

  const colors = ["#ef4444", "#3b82f6", "#10b981", "#f59e0b"];

  return (
    <div className="rounded-3xl border-2 border-ink bg-white p-4 shadow-[4px_4px_0_#13211b]">
      <span className="text-xs font-black uppercase text-forest">Simulation State Timeline</span>
      <div className="relative mt-2">
        <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full h-auto">
          {steps.map((_, idx) => (
            <g key={`lbl-${idx}`}>
              <line
                x1={getX(idx)}
                y1={paddingY}
                x2={getX(idx)}
                y2={svgH - paddingY}
                stroke="#eef0e7"
                strokeWidth={1}
                strokeDasharray="2 2"
              />
              <text x={getX(idx)} y={svgH - 2} textAnchor="middle" className="text-[8px] font-black fill-ink/30">
                {idx === 0 ? "Start" : `Step ${idx}`}
              </text>
            </g>
          ))}

          {variables.map((variable, varIdx) => {
            const color = colors[varIdx % colors.length];
            const pointsStr = steps
              .map((stepVals, stepIdx) => {
                const val = stepVals[variable.id] ?? variable.initial;
                return `${getX(stepIdx)},${getY(val, variable.min, variable.max)}`;
              })
              .join(" ");

            return (
              <g key={variable.id}>
                <polyline
                  fill="none"
                  stroke={color}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={pointsStr}
                  className="transition-all duration-300"
                />
                {steps.map((stepVals, stepIdx) => {
                  const val = stepVals[variable.id] ?? variable.initial;
                  return (
                    <circle
                      key={`dot-${stepIdx}`}
                      cx={getX(stepIdx)}
                      cy={getY(val, variable.min, variable.max)}
                      r={3}
                      fill={color}
                      stroke="#13211b"
                      strokeWidth={1.5}
                      className="transition-all duration-300 cursor-pointer"
                    >
                      <title>{`${variable.label}: ${val}`}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap gap-3 justify-center">
        {variables.map((variable, varIdx) => {
          const color = colors[varIdx % colors.length];
          return (
            <div key={variable.id} className="flex items-center gap-1.5 text-[9px] font-black uppercase text-ink/75">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
              <span>{variable.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
