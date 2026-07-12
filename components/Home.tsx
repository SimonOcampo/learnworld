"use client";

import { ArrowRight, BookOpen, Check, ChevronDown, ChevronUp, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import learnWorldImage from "@/app/Assets/learnworld.png";
import { builtInSkills } from "@/lib/catalog/repository";
import { fallbackLesson } from "@/lib/catalog";
import type { SkillDefinition } from "@/lib/schemas/skill";
import type { UserProgress } from "@/lib/schemas/progress";
import type { ConceptId } from "@/lib/types";
import { completeStoredSkill, getProgress } from "@/lib/storage/db";
import { emptyProgress } from "@/lib/progress/rules";
import { listCustomSkills } from "@/lib/storage/custom-skills";
import { SimulationShell } from "./SimulationShell";
import { GuidedSimulation } from "@/components/simulations/GuidedSimulation";

const interactiveConcept: Record<string, ConceptId> = {
  sorting: "insertion_sort", "graph-algorithms": "dijkstra", pointers: "pointers", strings: "strings", arrays: "arrays", structures: "structures", "dynamic-memory-allocation": "dynamic_memory_allocation", recursion: "recursion", "linked-lists": "linked_lists", stacks: "stacks", queues: "queues", "algorithm-analysis": "algorithm_analysis", "binary-trees": "binary_trees", "binary-search-trees": "binary_search_trees", heaps: "heaps", tries: "tries", "bitwise-operators": "bitwise_operators", "avl-trees": "avl_trees", "growth-of-functions": "growth_of_functions", "big-o": "big_o", "big-omega": "big_omega", "big-theta": "big_theta", "master-theorem": "master_theorem", "divide-and-conquer": "divide_and_conquer", backtracking: "backtracking", "b-trees": "b_trees", "red-black-trees": "red_black_trees", treaps: "treaps", "skip-lists": "skip_lists", "bloom-filters": "bloom_filters", "greedy-algorithms": "greedy_algorithms", "dynamic-programming": "dynamic_programming"
};

function completedSkillIds(progress: UserProgress) {
  return new Set(Object.values(progress.skills).filter((skill) => skill.completedChallengeIds.includes("lesson-complete")).map((skill) => skill.skillId));
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState<"all" | "cs1" | "cs2">("all");
  const [selected, setSelected] = useState<string[]>(["graph-algorithms"]);
  const [launched, setLaunched] = useState(false);
  const [customSkills, setCustomSkills] = useState<SkillDefinition[]>([]);
  const [progress, setProgress] = useState<UserProgress>(emptyProgress());
  const [progressReady, setProgressReady] = useState(false);
  const [progressError, setProgressError] = useState<string | null>(null);
  const [saveErrorSkillId, setSaveErrorSkillId] = useState<string | null>(null);

  useEffect(() => { void listCustomSkills().then(setCustomSkills).catch(() => undefined); }, []);
  useEffect(() => {
    let active = true;
    void getProgress()
      .then((stored) => { if (active) setProgress(stored); })
      .catch(() => { if (active) setProgressError("Progress storage is unavailable in this browser. Completed lessons cannot be saved."); })
      .finally(() => { if (active) setProgressReady(true); });
    return () => { active = false; };
  }, []);

  const allSkills = useMemo(() => [...builtInSkills, ...customSkills], [customSkills]);
  const skillMap = useMemo(() => new Map(allSkills.map((skill) => [skill.id, skill])), [allSkills]);
  const visible = useMemo(() => allSkills.filter((skill) => (course === "all" || skill.course === course) && [skill.title, skill.description, ...skill.aliases, ...skill.keywords].join(" ").toLowerCase().includes(query.toLowerCase())), [allSkills, course, query]);
  const completedIds = useMemo(() => completedSkillIds(progress), [progress]);

  function toggle(id: string) { setSelected((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); }
  function move(index: number, delta: number) { setSelected((items) => { const next = [...items]; const target = index + delta; if (target < 0 || target >= next.length) return items; [next[index], next[target]] = [next[target], next[index]]; return next; }); }
  async function finishSkill(skillId: string) {
    try {
      const saved = await completeStoredSkill(skillId);
      setProgress(saved);
      setSaveErrorSkillId(null);
    } catch {
      setSaveErrorSkillId(skillId);
    }
  }

  if (launched) return <QuestSession skills={selected.map((id) => skillMap.get(id)).filter((skill): skill is SkillDefinition => Boolean(skill))} progress={progress} saveErrorSkillId={saveErrorSkillId} onCompleteSkill={finishSkill} onExit={() => setLaunched(false)} />;

  return <main className="landing-page min-h-screen bg-cream paper-grid">
    <header className="border-b-2 border-ink bg-ink text-white"><div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5"><span className="display text-2xl font-black">LearnWorld<span className="text-orange">.</span></span><div className="flex items-center gap-3 text-xs font-black"><Link href="/custom" className="rounded-full border border-white/25 px-3 py-1">Custom workshop</Link><span className="rounded-full bg-lime px-3 py-1 text-ink">LEVEL {progress.level}</span><span>{progress.totalXp} XP</span></div></div></header>
    <section className="mx-auto max-w-7xl px-5 py-12">
      {progressError && <p role="alert" className="mb-5 rounded-2xl border-2 border-orange bg-white p-4 text-sm font-bold">{progressError}</p>}
      <div className="grid items-center gap-8 rounded-[32px] border-2 border-ink bg-white/80 p-6 shadow-[8px_8px_0_#13211b] lg:grid-cols-[minmax(0,1fr)_360px] lg:p-8"><div className="max-w-4xl"><span className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-xs font-black uppercase"><Sparkles size={15} />Build your learning quest</span><h1 className="display mt-5 text-5xl font-black leading-none sm:text-7xl">Choose the concepts.<br /><span className="text-forest">Enter the world.</span></h1><p className="mt-5 max-w-2xl text-lg text-ink/65">Select any mix of CS1 and CS2 skills. Each becomes an independent stop in one scrollable, game-like quest.</p></div><div className="relative mx-auto w-full max-w-sm lg:justify-self-end"><Image src={learnWorldImage} alt="LearnWorld globe and location marker" priority className="aspect-square w-full object-contain" sizes="(min-width: 1024px) 360px, 100vw" /></div></div>
      <div className="mt-10"><div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section><div className="panel sticky top-3 z-10 mb-5 flex flex-col gap-3 p-4 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-2xl border border-ink/15 bg-white px-4"><Search size={18} /><span className="sr-only">Search skills</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 32 skills…" className="w-full bg-transparent py-3 outline-none" /></label><div className="flex gap-2">{(["all", "cs1", "cs2"] as const).map((value) => <button key={value} onClick={() => setCourse(value)} className={`rounded-full px-4 py-2 text-xs font-black uppercase ${course === value ? "bg-ink text-white" : "bg-white"}`}>{value}</button>)}</div></div>
          <div className="grid gap-4 sm:grid-cols-2">{visible.map((skill) => <SkillCard key={skill.id} skill={skill} selected={selected.includes(skill.id)} completed={completedIds.has(skill.id)} onToggle={() => toggle(skill.id)} />)}</div>
        </section>
        <aside className="panel h-fit p-5 lg:sticky lg:top-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-orange p-2"><BookOpen size={20} /></span><div><h2 className="display text-xl font-black">Quest queue</h2><p className="text-xs font-bold text-ink/45">{selected.length} skill{selected.length === 1 ? "" : "s"} selected</p></div></div><ol className="mt-5 space-y-2">{selected.map((id, index) => { const skill = skillMap.get(id); if (!skill) return null; return <li key={id} className="flex items-center gap-2 rounded-2xl bg-cream p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-black text-white">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-extrabold">{skill.title}</span><button aria-label={`Move ${skill.title} up`} disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp size={17} /></button><button aria-label={`Move ${skill.title} down`} disabled={index === selected.length - 1} onClick={() => move(index, 1)}><ChevronDown size={17} /></button><button aria-label={`Remove ${skill.title}`} onClick={() => toggle(id)}><X size={17} /></button></li>; })}</ol>{!selected.length && <p className="mt-5 rounded-2xl bg-cream p-4 text-sm text-ink/55">Pick at least one skill to begin.</p>}<button disabled={!selected.length || !progressReady} onClick={() => setLaunched(true)} className="btn btn-lime mt-5 w-full py-4">{progressReady ? <>Launch quest <ArrowRight size={18} /></> : "Loading progress…"}</button></aside>
      </div></div>
    </section>
  </main>;
}

function SkillCard({ skill, selected, completed, onToggle }: { skill: SkillDefinition; selected: boolean; completed: boolean; onToggle: () => void }) {
  return <button onClick={onToggle} aria-pressed={selected} className={`relative min-h-44 rounded-[24px] border-2 p-5 text-left transition ${selected ? "border-ink bg-lime shadow-[5px_5px_0_#13211b]" : "border-ink/15 bg-white hover:-translate-y-1"}`}><div className="flex items-start justify-between gap-2"><span className="rounded-full bg-ink/8 px-3 py-1 text-[10px] font-black uppercase">{skill.course} · {skill.moduleId.replaceAll("-", " ")}</span><span className="flex gap-1">{completed && <span aria-label="Completed" className="inline-flex items-center gap-1 rounded-full bg-forest px-2 py-1 text-[10px] font-black text-white"><Check size={13} />Completed</span>}{selected && <span aria-label="Selected" className="rounded-full bg-ink p-1 text-white"><Check size={15} /></span>}</span></div><h2 className="display mt-6 text-2xl font-black">{skill.title}</h2><p className="mt-2 text-sm text-ink/75">{skill.description}</p><span className="mt-4 inline-block text-[10px] font-black uppercase text-forest">{skill.capability.replaceAll("-", " ")}</span></button>;
}

function QuestSession({ skills, progress, saveErrorSkillId, onCompleteSkill, onExit }: { skills: SkillDefinition[]; progress: UserProgress; saveErrorSkillId: string | null; onCompleteSkill: (skillId: string) => Promise<void>; onExit: () => void }) {
  const completedIds = completedSkillIds(progress);
  const completedCount = skills.filter((skill) => completedIds.has(skill.id)).length;
  const percent = skills.length ? completedCount / skills.length * 100 : 0;
  const complete = skills.length > 0 && completedCount === skills.length;
  return <main className="min-h-screen bg-cream"><header className="sticky top-0 z-30 border-b-2 border-ink bg-white"><div className="mx-auto flex max-w-[1500px] items-center gap-4 px-5 py-3"><button onClick={onExit} className="btn border border-ink/15 bg-white py-2">← Edit quest</button><div className="min-w-0 flex-1"><p className="display truncate font-black">Your learning quest</p><div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full bg-forest transition-all" style={{ width: `${percent}%` }} /></div></div><span className="rounded-full bg-lime px-3 py-1 text-xs font-black">🔥 {progress.streak.current} · LV {progress.level} · {progress.totalXp} XP</span></div></header><div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-8 lg:grid-cols-[220px_minmax(0,1fr)]"><nav className="hidden h-fit rounded-3xl bg-ink p-4 text-white lg:sticky lg:top-24 lg:block"><p className="px-2 text-xs font-black uppercase text-lime">Quest path</p><ol className="mt-4 space-y-2">{skills.map((skill, index) => { const completed = completedIds.has(skill.id); return <li key={skill.id}><a href={`#quest-${index}`} className="flex items-center gap-2 rounded-xl p-2 text-sm font-bold hover:bg-white/10"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${completed ? "bg-lime text-ink" : "bg-white/10"}`}>{completed ? "✓" : index + 1}</span>{skill.title}</a></li>; })}</ol></nav><div className="space-y-12">{skills.map((skill, index) => { const concept = interactiveConcept[skill.id]; const completed = completedIds.has(skill.id); return <section id={`quest-${index}`} key={skill.id} className="scroll-mt-24"><div className="mb-3 flex items-center gap-3"><span className={`flex h-9 w-9 items-center justify-center rounded-full font-black ${completed ? "bg-lime" : "bg-orange"}`}>{completed ? "✓" : index + 1}</span><div><p className="text-xs font-black uppercase text-forest">Quest stop · Mastery {progress.skills[skill.id]?.score ?? 0}%</p><h2 className="display text-2xl font-black">{skill.title}</h2></div></div>{saveErrorSkillId === skill.id && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-orange bg-white p-4 text-sm font-bold"><span>We could not save this lesson’s progress.</span><button className="btn border border-ink/20 bg-white" onClick={() => { void onCompleteSkill(skill.id); }}>Retry saving progress</button></div>}{concept ? <SimulationShell lesson={fallbackLesson(concept)} onExit={onExit} embedded onComplete={() => { void onCompleteSkill(skill.id); }} /> : <GuidedSkill skill={skill} onComplete={() => { void onCompleteSkill(skill.id); }} />}</section>; })}{complete && <section className="rounded-[32px] border-2 border-ink bg-lime p-8 text-center shadow-[8px_8px_0_#13211b]"><p className="text-xs font-black uppercase">Quest complete</p><h2 className="display mt-2 text-4xl font-black">You explored {skills.length} world{skills.length === 1 ? "" : "s"}.</h2><p className="mt-3 font-bold">Progress is saved on this browser. Replay any lesson whenever you want.</p><button onClick={onExit} className="btn btn-primary mt-5">Build another quest</button></section>}</div></div></main>;
}

function GuidedSkill({ skill, onComplete }: { skill: SkillDefinition; onComplete: () => void }) {
  const family = String(skill.simulation.config.family ?? "guided");
  return <article className="panel overflow-hidden border-2 border-ink"><div className="bg-ink p-5 text-white"><span className="rounded-full bg-orange px-3 py-1 text-[10px] font-black uppercase text-ink">Deterministic guided simulation</span><h3 className="display mt-4 text-3xl font-black">{skill.objectives[0].text}</h3></div><div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_280px]"><GuidedSimulation family={family} onComplete={onComplete} /><aside className="rounded-3xl bg-lime p-5"><p className="text-xs font-black uppercase">Pip’s field note</p><p className="mt-3 text-sm leading-relaxed">{skill.description}</p>{skill.misconceptions[0] && <p className="mt-5 rounded-2xl bg-white/70 p-3 text-xs font-bold">Watch out: {skill.misconceptions[0].text}</p>}</aside></div></article>;
}
