"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { advanceGuided, guidedEvents, initialGuidedState } from "@/lib/simulations/guided-engine";

export function GuidedSimulation({ family, onComplete }: { family: string; onComplete: () => void }) {
  const events=useMemo(()=>guidedEvents(family),[family]);const [state,setState]=useState(initialGuidedState);const sent=useRef(false);const current=events[Math.min(state.step,events.length-1)];
  useEffect(()=>{if(state.complete&&!sent.current){sent.current=true;onComplete()}},[state.complete,onComplete]);
  function reset(){sent.current=false;setState(initialGuidedState())}
  return <div><div className="grid min-h-72 gap-3 rounded-3xl border-2 border-ink/15 bg-[#eef0e7] p-5 sm:grid-cols-3">{events.map((event,index)=><div key={event.title} className={`flex min-h-40 flex-col justify-between rounded-2xl border-2 p-4 transition-all ${index<state.step?"border-forest bg-lime":index===state.step&&!state.complete?"border-ink bg-white shadow-[4px_4px_0_#13211b]":"border-ink/10 bg-white/45"}`}><span className="text-xs font-black uppercase">Step {index+1}</span><div><h4 className="display text-xl font-black">{event.title}</h4><p className="mt-2 text-xs leading-relaxed text-ink/75">{event.message}</p></div></div>)}</div><div className="mt-4 rounded-2xl bg-ink p-4 text-white"><p className="text-xs font-black uppercase text-lime">Predict before revealing</p><p className="mt-1 font-bold">{state.complete?"All rules verified. Explain the full state change in your own words.":current.prompt}</p></div><div className="mt-4 flex gap-3"><button onClick={reset} className="btn border border-ink/20 bg-white">Reset</button><button disabled={state.complete} onClick={()=>setState(value=>advanceGuided(value,events))} className="btn btn-lime flex-1">{state.complete?"Lesson complete · +20 XP":"Reveal next deterministic step"}</button></div></div>;
}
