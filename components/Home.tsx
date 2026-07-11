"use client";

import { ArrowRight, BookOpen, Brain, Check, ChevronDown, ChevronUp, Search, Sparkles, Target, Upload, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { builtInSkills } from "@/lib/catalog/repository";
import { fallbackLesson } from "@/lib/catalog";
import type { SkillDefinition } from "@/lib/schemas/skill";
import type { ConceptId } from "@/lib/types";
import { SimulationShell } from "./SimulationShell";
import { listCustomSkills } from "@/lib/storage/custom-skills";
import { completeSkill, emptyProgress } from "@/lib/progress/rules";
import { getProgress, saveProgress } from "@/lib/storage/db";
import type { UserProgress } from "@/lib/schemas/progress";
import { GuidedSimulation } from "@/components/simulations/GuidedSimulation";

const interactiveConcept: Record<string, ConceptId> = {
  sorting: "insertion_sort",
  "graph-algorithms": "dijkstra",
  pointers: "pointers",
  strings: "strings",
  arrays: "arrays",
  structures: "structures",
  "dynamic-memory-allocation": "dynamic_memory_allocation",
  recursion: "recursion",
  "linked-lists": "linked_lists",
  stacks: "stacks",
  queues: "queues",
  "algorithm-analysis": "algorithm_analysis",
  "binary-trees": "binary_trees",
  "binary-search-trees": "binary_search_trees",
  heaps: "heaps",
  tries: "tries",
  "bitwise-operators": "bitwise_operators",
  "avl-trees": "avl_trees",
  "growth-of-functions": "growth_of_functions",
  "big-o": "big_o",
  "big-omega": "big_omega",
  "big-theta": "big_theta",
  "master-theorem": "master_theorem",
  "divide-and-conquer": "divide_and_conquer",
  backtracking: "backtracking",
  "b-trees": "b_trees",
  "red-black-trees": "red_black_trees",
  treaps: "treaps",
  "skip-lists": "skip_lists",
  "bloom-filters": "bloom_filters",
  "greedy-algorithms": "greedy_algorithms",
  "dynamic-programming": "dynamic_programming"
};

type Stage = "intake" | "skills" | "teach" | "test";
type QuizQuestion = { id: string; skillId: string; prompt: string; options: string[]; answer: string; clue: string };

function pick<T>(items: T[], count: number) {
  return [...items].sort(() => Math.random() - 0.5).slice(0, count);
}

function buildQuiz(skills: SkillDefinition[], focusIds: string[] = []) {
  const focus = focusIds.length ? skills.filter((skill) => focusIds.includes(skill.id)) : skills;
  const pool = focus.length ? focus : skills;

  return pool.slice(0, 6).map((skill, index) => {
    const distractors = pick(
      skills.filter((item) => item.id !== skill.id).map((item) => item.title),
      3
    );
    const options = pick([skill.title, ...distractors], 4);
    return {
      id: `${skill.id}-${index}`,
      skillId: skill.id,
      prompt: skill.objectives[0]?.text || skill.description,
      options,
      answer: skill.title,
      clue: skill.misconceptions[0]?.text || `Focus on ${skill.title} mechanics.`
    };
  });
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("intake");
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState<"all" | "cs1" | "cs2">("all");
  const [selected, setSelected] = useState<string[]>([]);
  const [customSkills, setCustomSkills] = useState<SkillDefinition[]>([]);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listCustomSkills().then(setCustomSkills).catch(() => undefined);
  }, []);

  const allSkills = useMemo(() => [...builtInSkills, ...customSkills], [customSkills]);
  const skillMap = useMemo(() => new Map(allSkills.map((skill) => [skill.id, skill])), [allSkills]);

  const visible = useMemo(
    () =>
      allSkills.filter(
        (skill) =>
          (course === "all" || skill.course === course) &&
          [skill.title, skill.description, ...skill.aliases, ...skill.keywords].join(" ").toLowerCase().includes(query.toLowerCase())
      ),
    [allSkills, course, query]
  );

  const selectedSkills = useMemo(
    () => selected.map((id) => skillMap.get(id)).filter((skill): skill is SkillDefinition => Boolean(skill)),
    [selected, skillMap]
  );

  async function analyzeMaterial() {
    setAnalyzing(true);
    setAnalysisStatus("Reading lecture material and mapping skills…");
    try {
      const body = file
        ? (() => {
            const form = new FormData();
            form.append("file", file);
            form.append("title", title);
            return form;
          })()
        : JSON.stringify({ title, text });

      const result = await fetch("/api/material-analysis", {
        method: "POST",
        headers: file ? undefined : { "content-type": "application/json" },
        body
      });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || "Analysis failed.");

      const next = Array.isArray(data.skillIds) ? data.skillIds.filter((id: string) => skillMap.has(id)) : [];
      setSelected((prev) => [...new Set([...prev, ...next])]);
      setAnalysisStatus(data.summary || "Review the suggested skills before teaching.");
      setStage("skills");
    } catch (error) {
      setAnalysisStatus(error instanceof Error ? error.message : "Could not analyze this material.");
    } finally {
      setAnalyzing(false);
    }
  }

  function toggle(id: string) {
    setSelected((items) => (items.includes(id) ? items.filter((item) => item !== id) : [...items, id]));
  }

  function move(index: number, delta: number) {
    setSelected((items) => {
      const next = [...items];
      const target = index + delta;
      if (target < 0 || target >= next.length) return items;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  if (stage === "teach") {
    return (
      <QuestSession
        skills={selectedSkills}
        onExit={() => setStage("skills")}
        onBeginTesting={() => setStage("test")}
      />
    );
  }

  if (stage === "test") {
    return <AdaptiveTesting skills={selectedSkills} onBackToSkills={() => setStage("skills")} onRetakeTeaching={() => setStage("teach")} />;
  }

  return (
    <main className="min-h-screen bg-cream paper-grid">
      <header className="border-b-2 border-ink bg-ink text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <span className="display text-2xl font-black">LearnWorld<span className="text-orange">.</span></span>
          <div className="flex items-center gap-3 text-xs font-black">
            <Link href="/custom" className="rounded-full border border-white/25 px-3 py-1">Custom workshop</Link>
            <span className="rounded-full bg-lime px-3 py-1 text-ink">Teaching Pipeline</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <div className="max-w-5xl stage-enter">
          <span className="inline-flex items-center gap-2 rounded-full bg-lime px-4 py-2 text-xs font-black uppercase"><Sparkles size={15} /> Upload → Teach → Test</span>
          <h1 className="display mt-5 text-5xl font-black leading-none sm:text-7xl">Turn lectures into worlds.</h1>
          <p className="mt-5 text-lg text-ink/65">Upload lecture notes, review AI-matched skills, learn through interactive simulations, then take an adaptive test that targets what you missed.</p>
        </div>

        <div className="mt-8 flex flex-wrap gap-2 text-xs font-black uppercase">
          {[
            { id: "intake", label: "1 Material intake", icon: Upload },
            { id: "skills", label: "2 Skill matching", icon: Target },
            { id: "teach", label: "3 Teaching arena", icon: Brain },
            { id: "test", label: "4 Adaptive testing", icon: Check }
          ].map((item) => {
            const Icon = item.icon;
            const active = item.id === stage;
            return (
              <span key={item.id} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 ${active ? "bg-ink text-white" : "bg-white"}`}>
                <Icon size={14} /> {item.label}
              </span>
            );
          })}
        </div>

        {stage === "intake" && (
          <section className="panel mt-8 grid gap-6 p-6 lg:grid-cols-[1fr_320px] stage-enter">
            <div>
              <h2 className="display text-3xl font-black">Upload lecture material</h2>
              <p className="mt-2 text-sm text-ink/60">Skills detected here become contextual grounding for Gemini in the teaching area.</p>
              <label className="mt-5 block text-sm font-black">Lecture title
                <input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-2 w-full rounded-2xl border border-ink/20 bg-white p-3" />
              </label>
              <label className="mt-4 block text-sm font-black">Paste lecture excerpt
                <textarea value={text} onChange={(event) => { setText(event.target.value); setFile(null); }} maxLength={30000} className="mt-2 min-h-44 w-full rounded-2xl border border-ink/20 bg-white p-3" />
              </label>
              <input ref={inputRef} className="hidden" type="file" accept="application/pdf" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setText(""); }} />
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => inputRef.current?.click()} className="btn border border-dashed border-ink/30 bg-white">{file ? file.name : "Choose PDF"}</button>
                <button onClick={() => setStage("skills")} className="btn border border-ink/20 bg-white">Skip to manual selection</button>
              </div>
              <button onClick={analyzeMaterial} disabled={analyzing || (!text && !file && !title)} className="btn btn-lime mt-4">{analyzing ? "Analyzing…" : "Analyze material"}</button>
            </div>
            <aside className="rounded-3xl bg-cream p-5">
              <h3 className="display text-xl font-black">What happens next?</h3>
              <ol className="mt-4 space-y-3 text-sm font-semibold">
                <li>1. We match lecture content to relevant skills like hash maps or trees.</li>
                <li>2. You confirm the skill list and launch interactive teaching.</li>
                <li>3. You complete a scored test and get a targeted retest.</li>
              </ol>
              {analysisStatus && <p className="mt-4 rounded-2xl bg-ink p-3 text-sm font-bold text-white">{analysisStatus}</p>}
            </aside>
          </section>
        )}

        {stage === "skills" && (
          <section className="mt-10 stage-enter">
            <div className="panel mb-5 flex flex-col gap-3 p-4 sm:flex-row">
              <label className="flex flex-1 items-center gap-2 rounded-2xl border border-ink/15 bg-white px-4"><Search size={18} /><span className="sr-only">Search skills</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 32 skills…" className="w-full bg-transparent py-3 outline-none" /></label>
              <div className="flex gap-2">{(["all", "cs1", "cs2"] as const).map((value) => <button key={value} onClick={() => setCourse(value)} className={`rounded-full px-4 py-2 text-xs font-black uppercase ${course === value ? "bg-ink text-white" : "bg-white"}`}>{value}</button>)}</div>
            </div>
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <section><h2 className="display mb-3 text-3xl font-black">Recommended skills</h2><p className="mb-4 text-sm text-ink/60">Adjust this set before entering the teaching arena.</p><div className="grid gap-4 sm:grid-cols-2">{visible.map((skill) => <SkillCard key={skill.id} skill={skill} selected={selected.includes(skill.id)} onToggle={() => toggle(skill.id)} />)}</div></section>
              <aside className="panel h-fit p-5 lg:sticky lg:top-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-orange p-2"><BookOpen size={20} /></span><div><h2 className="display text-xl font-black">Skill queue</h2><p className="text-xs font-bold text-ink/45">{selected.length} skill{selected.length === 1 ? "" : "s"} selected</p></div></div><ol className="mt-5 space-y-2">{selected.map((id, index) => { const skill = skillMap.get(id); if (!skill) return null; return <li key={id} className="flex items-center gap-2 rounded-2xl bg-cream p-3"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-black text-white">{index + 1}</span><span className="min-w-0 flex-1 truncate text-sm font-extrabold">{skill.title}</span><button aria-label={`Move ${skill.title} up`} disabled={index === 0} onClick={() => move(index, -1)}><ChevronUp size={17} /></button><button aria-label={`Move ${skill.title} down`} disabled={index === selected.length - 1} onClick={() => move(index, 1)}><ChevronDown size={17} /></button><button aria-label={`Remove ${skill.title}`} onClick={() => toggle(id)}><X size={17} /></button></li>; })}</ol>{!selected.length && <p className="mt-5 rounded-2xl bg-cream p-4 text-sm text-ink/55">Pick at least one skill to begin.</p>}<button disabled={!selected.length} onClick={() => setStage("teach")} className="btn btn-lime mt-5 w-full py-4">Start teaching arena <ArrowRight size={18} /></button></aside>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}

function SkillCard({ skill, selected, onToggle }: { skill: SkillDefinition; selected: boolean; onToggle: () => void }) {
  return <button onClick={onToggle} aria-pressed={selected} className={`relative min-h-44 rounded-[24px] border-2 p-5 text-left transition card-float ${selected ? "border-ink bg-lime shadow-[5px_5px_0_#13211b]" : "border-ink/15 bg-white hover:-translate-y-1"}`}><div className="flex items-start justify-between"><span className="rounded-full bg-ink/8 px-3 py-1 text-[10px] font-black uppercase">{skill.course} · {skill.moduleId.replaceAll("-", " ")}</span>{selected && <span className="rounded-full bg-ink p-1 text-white"><Check size={15} /></span>}</div><h2 className="display mt-6 text-2xl font-black">{skill.title}</h2><p className="mt-2 text-sm text-ink/75">{skill.description}</p><span className="mt-4 inline-block text-[10px] font-black uppercase text-forest">{skill.capability.replaceAll("-", " ")}</span></button>;
}

function QuestSession({ skills, onExit, onBeginTesting }: { skills: SkillDefinition[]; onExit: () => void; onBeginTesting: () => void }) {
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [progress, setProgress] = useState<UserProgress>(emptyProgress());

  useEffect(() => { getProgress().then(setProgress).catch(() => undefined); }, []);

  function finish(index: number) {
    setCompleted((current) => {
      if (current.has(index)) return current;
      const next = new Set(current);
      next.add(index);
      setProgress((value) => {
        const updated = completeSkill(value, skills[index].id);
        void saveProgress(updated);
        return updated;
      });
      return next;
    });
  }

  const percent = skills.length ? (completed.size / skills.length) * 100 : 0;

  return (
    <main className="min-h-screen bg-cream">
      <header className="sticky top-0 z-30 border-b-2 border-ink bg-white">
        <div className="mx-auto flex max-w-[1500px] items-center gap-4 px-5 py-3">
          <button onClick={onExit} className="btn border border-ink/15 bg-white py-2">← Edit skills</button>
          <div className="min-w-0 flex-1"><p className="display truncate font-black">Teaching arena</p><div className="mt-1 h-2 overflow-hidden rounded-full bg-ink/10"><div className="h-full bg-forest transition-all" style={{ width: `${percent}%` }} /></div></div>
          <span className="rounded-full bg-lime px-3 py-1 text-xs font-black">🔥 {progress.streak.current} · LV {progress.level} · {progress.totalXp} XP</span>
        </div>
      </header>
      <div className="mx-auto grid max-w-[1500px] gap-6 px-5 py-8 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav className="hidden h-fit rounded-3xl bg-ink p-4 text-white lg:sticky lg:top-24 lg:block">
          <p className="px-2 text-xs font-black uppercase text-lime">Quest path</p>
          <ol className="mt-4 space-y-2">{skills.map((skill, index) => <li key={`${skill.id}-${index}`}><a href={`#quest-${index}`} className="flex items-center gap-2 rounded-xl p-2 text-sm font-bold hover:bg-white/10"><span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${completed.has(index) ? "bg-lime text-ink" : "bg-white/10"}`}>{completed.has(index) ? "✓" : index + 1}</span>{skill.title}</a></li>)}</ol>
        </nav>
        <div className="space-y-12">
          {skills.map((skill, index) => {
            const concept = interactiveConcept[skill.id];
            return (
              <section id={`quest-${index}`} key={`${skill.id}-${index}`} className="scroll-mt-24">
                <div className="mb-3 flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange font-black">{completed.has(index) ? "✓" : index + 1}</span><div><p className="text-xs font-black uppercase text-forest">Teaching stop · Mastery {progress.skills[skill.id]?.score ?? 0}%</p><h2 className="display text-2xl font-black">{skill.title}</h2></div></div>
                {concept ? <SimulationShell lesson={fallbackLesson(concept)} onExit={onExit} embedded onComplete={() => finish(index)} /> : <GuidedSkill skill={skill} onComplete={() => finish(index)} />}
              </section>
            );
          })}
          {completed.size === skills.length && (
            <section className="rounded-[32px] border-2 border-ink bg-lime p-8 text-center shadow-[8px_8px_0_#13211b] stage-enter">
              <p className="text-xs font-black uppercase">Teaching complete</p>
              <h2 className="display mt-2 text-4xl font-black">Ready for adaptive testing.</h2>
              <p className="mt-3 font-bold">You will be scored, then retested on missed concepts.</p>
              <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
                <button onClick={onBeginTesting} className="btn btn-primary">Start adaptive test</button>
                <button onClick={onExit} className="btn border border-ink/20 bg-white">Adjust skills</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function GuidedSkill({ skill, onComplete }: { skill: SkillDefinition; onComplete: () => void }) {
  const family = String(skill.simulation.config.family ?? "guided");
  return <article className="panel overflow-hidden border-2 border-ink"><div className="bg-ink p-5 text-white"><span className="rounded-full bg-orange px-3 py-1 text-[10px] font-black uppercase text-ink">Deterministic guided simulation</span><h3 className="display mt-4 text-3xl font-black">{skill.objectives[0].text}</h3></div><div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1fr)_280px]"><GuidedSimulation family={family} onComplete={onComplete} /><aside className="rounded-3xl bg-lime p-5"><p className="text-xs font-black uppercase">Pip’s field note</p><p className="mt-3 text-sm leading-relaxed">{skill.description}</p>{skill.misconceptions[0] && <p className="mt-5 rounded-2xl bg-white/70 p-3 text-xs font-bold">Watch out: {skill.misconceptions[0].text}</p>}</aside></div></article>;
}

function AdaptiveTesting({ skills, onBackToSkills, onRetakeTeaching }: { skills: SkillDefinition[]; onBackToSkills: () => void; onRetakeTeaching: () => void }) {
  const [round, setRound] = useState<1 | 2>(1);
  const [questions, setQuestions] = useState<QuizQuestion[]>(() => buildQuiz(skills));
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState("");

  useEffect(() => {
    setRound(1);
    setQuestions(buildQuiz(skills));
    setAnswers({});
    setScore(null);
    setAnalysis("");
  }, [skills]);

  if (!skills.length) {
    return (
      <main className="min-h-screen bg-cream p-6">
        <section className="panel mx-auto max-w-3xl p-6 text-center">
          <h1 className="display text-4xl font-black">Adaptive testing</h1>
          <p className="mt-3">Select at least one skill first.</p>
          <button onClick={onBackToSkills} className="btn btn-primary mt-4">Back to skills</button>
        </section>
      </main>
    );
  }

  function submit() {
    const correct = questions.filter((question) => answers[question.id] === question.answer);
    const wrong = questions.filter((question) => answers[question.id] !== question.answer);
    const nextScore = Math.round((correct.length / Math.max(questions.length, 1)) * 100);
    setScore(nextScore);

    if (round === 1 && wrong.length) {
      const focusIds = [...new Set(wrong.map((question) => question.skillId))];
      setAnalysis(`AI analysis: You missed ${wrong.length} prompt${wrong.length === 1 ? "" : "s"}. The retest now focuses on ${focusIds.length} concept area${focusIds.length === 1 ? "" : "s"}.`);
      setRound(2);
      setQuestions(buildQuiz(skills, focusIds));
      setAnswers({});
      return;
    }

    setAnalysis(wrong.length
      ? `AI analysis: Keep practicing these misconceptions: ${wrong.map((item) => item.clue).slice(0, 2).join(" ")}`
      : "AI analysis: Perfect score. Move to harder mixed quests.");
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <main className="min-h-screen bg-cream paper-grid px-5 py-10">
      <section className="mx-auto max-w-5xl stage-enter">
        <div className="panel p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase text-forest">Adaptive testing · Round {round}</p>
              <h1 className="display text-4xl font-black">Score, analyze, retest</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={onBackToSkills} className="btn border border-ink/20 bg-white">Edit skills</button>
              <button onClick={onRetakeTeaching} className="btn border border-ink/20 bg-white">Back to teaching</button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {questions.map((question) => (
              <article key={question.id} className="rounded-3xl border border-ink/15 bg-white p-4 card-float">
                <p className="text-xs font-black uppercase text-forest">{skillTitle(skills, question.skillId)}</p>
                <h2 className="mt-2 font-extrabold">{question.prompt}</h2>
                <div className="mt-3 grid gap-2">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      onClick={() => setAnswers((value) => ({ ...value, [question.id]: option }))}
                      className={`rounded-xl border px-3 py-2 text-left text-sm font-bold ${answers[question.id] === option ? "border-ink bg-lime" : "border-ink/15 bg-cream"}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-bold text-ink/60">{answeredCount}/{questions.length} answered</p>
            <button onClick={submit} disabled={answeredCount < questions.length} className="btn btn-primary">Submit round</button>
          </div>

          {score !== null && <p className="mt-4 rounded-2xl bg-lime p-3 text-sm font-black">Score: {score}%</p>}
          {analysis && <p className="mt-3 rounded-2xl bg-ink p-3 text-sm font-bold text-white">{analysis}</p>}
        </div>
      </section>
    </main>
  );
}

function skillTitle(skills: SkillDefinition[], id: string) {
  return skills.find((skill) => skill.id === id)?.title ?? "Skill";
}
