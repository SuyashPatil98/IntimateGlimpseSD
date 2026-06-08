# UI Design Prompt — paste into claude.ai (with Artifacts on)

Use Claude (claude.ai, Opus/Sonnet, Artifacts enabled) to design the look & feel.
Iterate visually there, then paste the generated code back to the build session for integration.

---

You are designing the UI for **SystemDesignAI**, a personal system-design learning tool for a single power user. This is NOT a chat app and NOT a SaaS product — it is a **"learning cockpit"**: a focused, premium desktop web app where the user studies system design grounded in their own ~300-page knowledge vault. It must *feel* intelligent and information-rich — like a high-end developer tool (Linear × Obsidian × a trading terminal), never a toy chatbot.

Build it as a single self-contained React artifact in **TypeScript + Tailwind CSS**. Use **lucide-react** for icons and **recharts** for charts. Put all **mock data in clearly-labeled constants at the top** so it is trivial to swap for a real API later. Do not make network calls — render from the mock data. Make it **dark-themed, elegant, dense-but-calm**, responsive to tablet width, and keyboard-friendly.

## Product philosophy (let this shape every screen)
- The **vault is the brain** — ~300 interlinked notes across 14 areas. The app keeps the vault visible.
- The LLM is a **compiler, not a chatbot**: conversations get distilled into permanent notes. "Promote to vault" should feel as routine as ⌘S.
- **Progress is earned, never faked** — every status badge reflects real note quality.
- The app should *show its intelligence*: which notes it retrieved, how confident, how concepts connect.

## Design system (define once, reuse everywhere)
- Dark UI, one restrained accent (suggest a vivid violet/indigo). Subtle borders, soft elevation, monospace for metadata.
- **14 area colors** (one each), used as small chips/dots: distributed-systems, databases, networking, storage, messaging, caching, reliability, architecture-patterns, design-patterns, software-engineering, data-engineering, ml-systems, system-design-interview, case-studies.
- **Status badges** with distinct weight: stub → draft → mature → comprehensive.
- A persistent top bar: vault stats (total notes, promoted-today), a **backend status indicator** (Qwen ✓ / Claude ✓ / fallback / down), and a ⌘K command-palette affordance.

## Real data shapes (design against these EXACT shapes)
```ts
type Area = "distributed-systems"|"databases"|"networking"|"storage"|"messaging"|"caching"|"reliability"|"architecture-patterns"|"design-patterns"|"software-engineering"|"data-engineering"|"ml-systems"|"system-design-interview"|"case-studies";
type Status = "stub"|"draft"|"mature"|"comprehensive";

type SourceChip = { page: string; title: string; area: Area; status: Status; score: number; matched_sections: string[]; snippet: string; via: "retrieval"|"graph" };
type Health = { backends: { qwen: boolean; claude: boolean; gemini: boolean }; vault: { pages: number } };

// Streaming answer events, received in order over SSE:
// {type:"sources", sources: SourceChip[]}
// {type:"backend", backend:"qwen"|"claude", model:string, primary:boolean}
// {type:"chunk", text:string}     // append to the answer
// {type:"notice", text:string}    // fallback banner: "qwen failed; falling back to claude"
// {type:"done"}

type PromoteProposal = {
  decision: "CREATE"|"EXTEND"|"SKIP"; reason: string; promotion_type: string;
  title?: string; area?: Area; content?: string;                 // CREATE
  target_title?: string; target_section?: string;                // EXTEND
  merge_strategy?: "ADD_ROW_TO_TABLE"|"ADD_BULLET"|"REWRITE_PARAGRAPH"|"ADD_RECALL_QUESTION"|"ADD_SUBSECTION";
  new_content?: string; wikilinks: string[];
  conflicts_with: string[]; conflict_description?: string|null;
};

type Flashcard = { page: string; area: Area; question: string; answer: string; deepExplanation?: string; due: string; ease: number };
```

## Screens (do these first, in order)
1. **Dashboard** (opens every session). Left: session state — timer, queries/promotions this session, "Compile Session" button, last 5 promoted notes. Center: "Today's Focus" — 3 suggested notes (with status), quick-start buttons (Resume / New area / Flashcards). Right: vault health — 14 area coverage rings (% mature), notes promoted this week, lint status, backend status. Bottom: streak + total-notes counters. Use recharts for rings/sparklines.
2. **Study** (the daily driver) — **three columns:** (left ~240px) session context: collapsed history, live "pages retrieved for this answer" list, "Compile Session"; (center) the conversation — each answer streams in, followed by a **row of source chips** (title + area dot + small confidence score + status), an optional **yellow "Vault gap" banner** ("Vault gap: <topic> — promote a page?"), and a per-answer **Promote** button; full-width input at the bottom (⌘Enter to send); a dismissible **fallback banner** at top when the backend switches; (right ~320px, collapsible) **page preview** rendering a vault note when a source chip is clicked, with an "Extend this page" button.
3. **Promote modal** (over Study) — the heart of the product. Shows the PromoteProposal: CREATE/EXTEND/SKIP header, target note + section + merge strategy, an **editable markdown area** with the proposed content, **inline conflict warnings** when conflicts_with is non-empty, Confirm / Cancel. Make it feel precise and trustworthy.
4. **Knowledge Graph** — full-screen network. Nodes sized by inbound links, colored by area, shaped by status; hover highlights neighbors; click opens the right-panel preview; an "orphans" toggle. (For the mockup, an animated SVG/force layout with ~30 sample nodes is fine — a real graph engine gets wired in later.)

Then, lower priority and simpler: **Vault Explorer** (area pills + status filter + search-as-you-type + note grid), **Flashcards** (one card at a time; reveal answer + deepExplanation; Again/Hard/Good/Easy; a prominent **"Improve Flashcards"** button implying an AI enrichment pass), **Roadmap**, **Ingest** (drag-drop + processing queue).

## Output requirements
- Componentized and prop-driven (one component per major piece); mock data in constants at the top.
- No external API calls; render everything from mock data.
- Polished micro-interactions: hover states, smooth panel collapse, subtle streaming animation on answer text.
- Accessible (keyboard nav, focus rings, aria labels) and responsive.
- Make it look like something a senior engineer is proud to use daily.

Start with the **Dashboard and Study** screens plus the shared design system. Show me the interactive artifact; I'll iterate on the look before we do the other screens.
