# LearnWorld Winning MVP Roadmap for a Twelve-Hour Hackathon

## Strategic recommendation

The strongest version of **LearnWorld** is not “AI makes a quiz.” It is a **learning compiler**: static material in, interactive environment out. That framing is stronger both pedagogically and competitively, because active learning consistently outperforms passive lecture in STEM settings. In a large meta-analysis of 225 studies, active learning improved exam performance by about 6% and students in traditional lecture settings were substantially more likely to fail than students in active-learning settings. A later PNAS study similarly found that students in active classrooms learned more even when they *felt* they were learning less, which matters for your demo UX: the product should make productive struggle feel guided, not confusing. citeturn6search0turn6search2turn12search0

For a twelve-hour hackathon, the winning move is to **ship one deep interaction loop** instead of trying to prove generality through many half-built domains. Your own proposed positioning is correct: the judge should manipulate a system, watch the visualization update, receive a contextual question, and see the explanation adapt in real time. That interaction loop is the part that will read as technically ambitious, pedagogically defensible, and demo-friendly. The rest of the product should exist only to support that moment.

The best immediate implementation choice is to make **Dijkstra’s algorithm** the only fully working domain. It gives you a crisp concept model, deterministic state transitions, obvious visual affordances, and a judge-friendly mental model. It also gives the tutor something concrete to reason over: visited nodes, tentative distances, predecessor links, and the current frontier. In practice, that means you can show “AI understands what just changed” rather than “AI generated some educational copy.”

## Why Dijkstra should be the single working domain

Dijkstra is the safest MVP because the concept naturally decomposes into entities, rules, constraints, and objectives. That is exactly the kind of schema you want if you are pitching LearnWorld as a compiler from educational content into an executable learning environment. The simulation can expose a graph, a source node, tentative distances, a priority queue, a visited set, and a step index; the tutor can then ask questions against real simulation state rather than a static explanation.

Just as important, Dijkstra gives you a deterministic backend. That matters because Google’s structured-output guidance explicitly recommends validating model outputs and handling cases where JSON is well-formed but semantically wrong. In other words, the model should not be your source of truth for the algorithm itself. The **simulation engine** should be deterministic and authoritative; Gemini should do extraction, pedagogy, questioning, explanation, and interaction management around that state. citeturn10view3

This distinction is strategically important in front of judges. If the graph changes and the shortest-path logic updates instantly because your local engine recomputed it, the app feels robust. If the tutor then explains *why* the frontier changed and asks a targeted predictive question, the app feels intelligent. That split is the simplest path to a reliable “magic moment.”

If you want breadth without overbuilding, keep your proposed four-card shell exactly as a presentation device: **Algorithms** works end-to-end; **Physics**, **Economics**, and **Biology** are honest preview cards. Phrase this as a platform claim: “the current prototype compiles into a graph-algorithm simulation, but the concept schema generalizes to other rule-based domains.” That is believable because your architecture actually will separate ingestion, concept extraction, simulation planning, rendering, and tutoring.

## MVP architecture with Google Gemini API

Google’s current recommendation is to build new projects on the **Interactions API**, which is generally available and positioned as the standard interface for multimodal understanding, structured outputs, tool orchestration, and agentic workflows. For LearnWorld, that matters because one API can cover PDF ingestion, structured concept extraction, multi-turn tutoring, and optional function calling. citeturn9view1turn8search12

For the core model, the best default is **`gemini-3.5-flash`**. Google documents it as a stable model with support for text, image, video, audio, and PDF inputs, plus structured outputs, function calling, caching, search grounding, and URL context. That makes it unusually well suited to a hackathon app where one model must do several jobs reliably and quickly. If you want the educational framing to feel even more native to Google’s ecosystem, it is also useful that Google says **LearnLM capabilities have been integrated into Gemini starting with the 2.5 series**, so you do not need a separate educational model endpoint to justify pedagogy-aware prompting. citeturn9view0turn17view0

For the SDK, use **`@google/genai`** server-side. Google recommends the Google GenAI SDK as the official, production-ready library family, and their web-app guidance says direct browser calls are only for prototyping; server-side use is the safer alternative. For a hackathon, that translates into a very small backend route rather than a large backend system: one route for ingestion/extraction, one for tutor turns, one for saving demo samples if needed. citeturn9view2turn4view6

For file handling, use the **Files API** whenever the uploaded notes or PDFs should be reused across multiple requests. Google’s document-processing and Files documentation says Gemini can process PDFs natively with vision, interpret text and visual elements together, and extract structured data from them; for larger or reusable documents, the Files API improves latency and reduces bandwidth, PDF prompts are capped at 50 MB, and uploaded files are stored for 48 hours. In the app itself, however, you should impose a much smaller product limit for the hackathon—something like one page or a short excerpt—because that keeps latency down and avoids ugly failure cases during the demo. citeturn11view1turn4view5turn11view3

For the interactive canvas, use **Cytoscape.js**, not a bespoke canvas from scratch. Cytoscape.js is explicitly designed for graph analysis and visualization, supports rich interactive graphs, and is easy to manipulate in the browser. That is a better fit for Dijkstra than a node-editor library because you need a living graph with algorithmic state, not a generic workflow editor. citeturn13view0

The winning architecture is therefore:

- **Frontend:** Next.js or Vite React app with a single polished flow.
- **Graph layer:** Cytoscape.js for the Dijkstra canvas.
- **Deterministic engine:** local TypeScript module computes state transitions.
- **AI layer:** Gemini Interactions API over `@google/genai`.
- **Persistence:** ephemeral in-memory or local JSON for demo sessions only.
- **Upload handling:** plain text paste first, PDF second if time remains.

That stack is intentionally small. It is enough to look real without burning hackathon time on non-demo infrastructure.

## Twelve-hour build roadmap

Below is the most realistic path to a polished demo. The hidden rule is simple: **the deterministic simulation must exist before the AI tutor exists**. If the state engine is weak, the tutor will feel fake.

| Time block | Build target | Definition of done |
|---|---|---|
| Hour zero to one | Scaffold the app | One-page flow with routes or panels for upload, extraction, simulation, and result summary. Hardcode one sample Dijkstra note. |
| Hour one to two | Build the Dijkstra state engine | You can load a graph JSON, step forward deterministically, recompute tentative distances, track visited nodes, predecessors, and current frontier. |
| Hour two to three | Render the graph interactively | Nodes/edges render in Cytoscape; controls exist for next step, reset, and edit edge weight. |
| Hour three to four | Add Gemini extraction | Pasted text goes to Gemini; returned JSON includes entities, rules, constraints, objective, misconceptions, and `simulation_template`. |
| Hour four to five | Connect extraction to view state | The extraction screen displays a concept model card and a “Launch simulation” button. |
| Hour five to six | Add guided lesson panel | A side panel shows “what this algorithm is doing now,” using current simulation state. |
| Hour six to seven | Add tutor panel | “Explain this step” and “Challenge me” both work using current state; model returns tutor text plus a contextual question. |
| Hour seven to eight | Add judge interaction loop | Editing an edge weight triggers recomputation, view update, and a new tutor prompt tied to the new state. |
| Hour eight to nine | Add misconception/result screen | Surface one or two inferred misconceptions, such as confusing tentative with final distance or picking the wrong next node. |
| Hour nine to ten | Add polish and fallback content | Static preview cards for Physics, Economics, Biology; one clean architecture graphic or panel; sample uploaded note preloaded. |
| Hour ten to eleven | Demo hardening | Try bad inputs, long notes, invalid graphs, empty states; lock in a pristine sample and a backup graph. |
| Hour eleven to twelve | Rehearsal | Practice the exact judge flow three times, record a 30-second backup video, and freeze scope. |

The critical milestone is **the end of hour six**. By that point, you should already have: a working Dijkstra simulation, a visible concept-extraction panel, and at least one Gemini-powered explanation path. If you do not have all three by then, cut aggressively.

The first things to cut are easy: PDF upload, arbitrary graph creation, multiple subject domains, multi-user state, authentication, analytics, and anything resembling a learning-management system. Google’s own web guidance makes clear that direct web integrations are for prototyping and that a fuller production architecture belongs elsewhere; for the hackathon, that is permission to stay narrow and demo-first. citeturn4view6

The most important scope discipline is this: **do not attempt arbitrary simulation generation**. Instead, let Gemini classify whether the input maps to your approved template, `dijkstra_graph_v1`. If yes, generate the concept model and lesson. If not, show a graceful preview card that says the concept is recognized but not yet fully compilable in this prototype. That single product decision can save multiple hours.

## Prompting and state-aware tutoring design

The best use of Gemini here is **structured extraction plus state-aware tutoring**. Google’s structured-output docs say Gemini can be constrained with JSON Schema, including object properties, required fields, enums, and arrays, and explicitly position structured outputs for data extraction, structured classification, and agentic workflows. That is exactly what you need for a reliable compiler pipeline. citeturn10view4turn10view3

Your first Gemini call should be the **concept extractor**. Feed it the user’s pasted notes or uploaded PDF and ask for a schema like this:

```json
{
  "topic_title": "string",
  "domain": "algorithms",
  "simulation_template": "dijkstra_graph_v1 | unsupported",
  "entities": ["node", "edge", "source"],
  "rules": ["pick smallest tentative unvisited node", "relax outgoing edges"],
  "constraints": ["nonnegative weights"],
  "objective": "single-source shortest paths",
  "variables": ["visited_set", "distance_map", "predecessor_map", "priority_queue"],
  "misconceptions": ["tentative_distance_is_final", "selects_smallest_edge_not_smallest_distance"],
  "lesson_outline": ["..."],
  "visual_plan": ["..."]
}
```

That output should drive the UI, not just live in the backend. Show it on-screen as the “compiled concept model.” That helps judges see a genuine transformation step rather than a black-box LLM call.

Your second Gemini call should be the **tutor turn**. The input should include the current simulation state as compact JSON, plus the latest action the learner took. The output should also be structured:

```json
{
  "mode": "explain | challenge | feedback",
  "message": "string",
  "question": "string",
  "expected_answer": "string",
  "hint": "string",
  "misconception_label": "string | null",
  "difficulty_adjustment": "easier | same | harder"
}
```

This is where you make the tutor feel alive. After a learner changes an edge weight, send Gemini the state delta, not just the full state blob. The tutor can then say: “You reduced A–C from 7 to 2. Which node now has the smallest tentative distance?” Because the question references a just-made change, it feels grounded in the simulation rather than templated.

Use **`previous_interaction_id`** for tutor continuity if you want the conversation to feel memory-enabled without resending the entire history every turn. Google documents this as the Interactions API’s server-side conversation-state mechanism, with the caveat that tools and system instructions are interaction-scoped and must be resent on subsequent calls. That means you can keep the tutoring conversation coherent while still controlling the prompt every turn. citeturn15view0turn15view1

If you want a stricter “the tutor can query the simulation” architecture, Gemini’s function-calling support can connect the model to external tools and APIs, and Google explicitly frames it as a way to augment knowledge or extend model capabilities with external computation. In LearnWorld, that could mean exposing tiny backend tools such as `get_current_state`, `get_next_correct_node`, or `check_student_prediction`. That said, for a twelve-hour hackathon, the simpler and probably better path is to compute everything locally and pass state directly to the model. Function calling is most useful if you want the *model* to decide when it needs an additional state lookup. citeturn14view0turn14view2

A representative JavaScript integration pattern would look like this:

```ts
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function extractConcept(inputText: string) {
  const res = await ai.interactions.create({
    model: "gemini-3.5-flash",
    input: inputText,
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: conceptSchema
    }
  });

  return JSON.parse(res.output_text);
}

export async function tutorTurn(simState: object, action: object, previousId?: string) {
  const res = await ai.interactions.create({
    model: "gemini-3.5-flash",
    previous_interaction_id: previousId,
    system_instruction: tutorInstruction,
    input: JSON.stringify({ simState, action }),
    response_format: {
      type: "text",
      mime_type: "application/json",
      schema: tutorSchema
    }
  });

  return { id: res.id, data: JSON.parse(res.output_text) };
}
```

That pattern matches Google’s current recommendations: Interactions API for new projects, the official GenAI SDK, structured outputs for predictable JSON, and server-side calls for anything beyond throwaway prototyping. citeturn9view1turn9view2turn10view4

## Demo choreography and judging strategy

The winning demo is a **participatory lesson**, not a product tour. Start with a short line that frames the problem crisply: educational content is still mostly delivered as static PDFs, slides, and notes, while learning improves when students actively engage with concepts rather than only consume explanations. That framing is well supported by the active-learning literature, so it gives the product a research-backed “why” without sounding academic. citeturn6search0turn6search2

Then run the judge through this sequence:

First, paste a short Dijkstra definition or upload a tiny sample PDF.  
Second, show the extracted concept model for two or three seconds.  
Third, launch the simulation and point out that the graph, tentative distances, and current frontier were generated from the material.  
Fourth, ask the judge to change an edge weight.  
Fifth, let the graph recompute instantly.  
Sixth, click **Challenge me** so the tutor asks a question about the updated state.  
Seventh, click **Explain this step** and let Gemini justify the new frontier or distance update.  
Finally, end on a result panel that names one misconception the system detected.

That sequence works because it proves four things in less than two minutes: the system ingests learning material, compiles a concept model, produces an explorable environment, and adapts pedagogically to state changes.

You should also control for the risk highlighted by the learning literature: people sometimes interpret effortful learning experiences as if they are worse, even when they are more effective. In demo terms, that means the interface should always reassure the learner through visible progress and concise tutor messaging. Good microcopy here matters more than extra features. citeturn12search0

Your final slide or closing sentence should not say, “we built a Dijkstra visualizer.” It should say something closer to this:

> **LearnWorld compiles static educational material into interactive learning environments. Our prototype demonstrates the compiler on graph algorithms, where a student can manipulate the concept itself and receive tutoring grounded in the simulation’s live state.**

That is the version that sounds like a platform, feels like a product, and is still honest about what you built in twelve hours.