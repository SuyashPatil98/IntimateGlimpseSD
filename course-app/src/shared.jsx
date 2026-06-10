/* global React */
/* ============================================================
   SystemDesignAI — shared atoms, icons, and mock data.
   Everything network-shaped is mocked here for easy API swap.
   ============================================================ */

// =========================================================
// ICONS — small inline SVGs (lucide-style strokes, 1.5w)
// =========================================================
const Icon = ({ d, size = 14, fill = "none", stroke = "currentColor", sw = 1.5, ...rest }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={stroke}
       strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" {...rest}>
    {typeof d === "string" ? <path d={d} /> : d}
  </svg>
);

const I = {
  Home:     (p) => <Icon {...p} d="M3 10.5L12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />,
  Study:    (p) => <Icon {...p} d={<><path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4z"/><path d="M4 4v12a4 4 0 0 0 4 4h12"/><path d="M8 8h8M8 12h6"/></>} />,
  Vault:    (p) => <Icon {...p} d={<><path d="M3 7l9-4 9 4v6c0 5-4 8-9 9-5-1-9-4-9-9z"/><path d="M9 12l2 2 4-4"/></>} />,
  Graph:    (p) => <Icon {...p} d={<><circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="18" r="2.5"/><circle cx="12" cy="12" r="2.5"/><path d="M8 7l3 3M16 7l-3 3M8 17l3-3M16 17l-3-3"/></>} />,
  Cards:    (p) => <Icon {...p} d={<><rect x="3" y="7" width="14" height="14" rx="2"/><path d="M7 3h14v14"/></>} />,
  Map:      (p) => <Icon {...p} d={<><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/></>} />,
  Ingest:   (p) => <Icon {...p} d={<><path d="M12 3v12m0 0l-4-4m4 4l4-4"/><path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"/></>} />,
  Search:   (p) => <Icon {...p} d={<><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/></>} />,
  Command:  (p) => <Icon {...p} d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3z" />,
  Play:     (p) => <Icon {...p} d="M7 4l13 8-13 8z" fill="currentColor" stroke="none" />,
  Sparkle:  (p) => <Icon {...p} d={<><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></>} />,
  Check:    (p) => <Icon {...p} d="M4 12l5 5L20 6" />,
  X:        (p) => <Icon {...p} d="M6 6l12 12M18 6L6 18" />,
  Plus:     (p) => <Icon {...p} d="M12 5v14M5 12h14" />,
  ArrowR:   (p) => <Icon {...p} d="M5 12h14m-5-5l5 5-5 5" />,
  ArrowU:   (p) => <Icon {...p} d="M12 19V5m-5 5l5-5 5 5" />,
  ChevR:    (p) => <Icon {...p} d="M9 6l6 6-6 6" />,
  ChevL:    (p) => <Icon {...p} d="M15 6l-6 6 6 6" />,
  ChevD:    (p) => <Icon {...p} d="M6 9l6 6 6-6" />,
  Timer:    (p) => <Icon {...p} d={<><circle cx="12" cy="13" r="8"/><path d="M9 2h6M12 7v6l3 2"/></>} />,
  Flame:    (p) => <Icon {...p} d="M12 3c1 4 6 5 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 4 2-1-2 0-5 0-6z" />,
  Layers:   (p) => <Icon {...p} d={<><path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5M3 18l9 5 9-5"/></>} />,
  Send:     (p) => <Icon {...p} d="M22 2L11 13M22 2l-7 20-4-9-9-4z" />,
  Promote:  (p) => <Icon {...p} d={<><path d="M12 3v12m0 0l-4-4m4 4l4-4" transform="rotate(180 12 12)"/><rect x="4" y="3" width="16" height="3" rx="0.5"/></>} />,
  Compile:  (p) => <Icon {...p} d={<><path d="M4 4h16v6H4zM4 14h16v6H4z"/><path d="M8 7h.01M8 17h.01"/></>} />,
  File:     (p) => <Icon {...p} d={<><path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z"/><path d="M13 3v7h7"/></>} />,
  Link:     (p) => <Icon {...p} d={<><path d="M10 14a4 4 0 0 0 5.6 0l3-3a4 4 0 0 0-5.6-5.6l-1 1"/><path d="M14 10a4 4 0 0 0-5.6 0l-3 3a4 4 0 0 0 5.6 5.6l1-1"/></>} />,
  Eye:      (p) => <Icon {...p} d={<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></>} />,
  Alert:    (p) => <Icon {...p} d={<><path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.01"/></>} />,
  Bolt:     (p) => <Icon {...p} d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none" />,
  Dot:      (p) => <Icon {...p} d="M12 12h.01" />,
  Pin:      (p) => <Icon {...p} d="M12 17v5m0-19l-4 4 1 6-4 1v2h14v-2l-4-1 1-6z" />,
  Collapse: (p) => <Icon {...p} d="M9 4v4H5M15 20v-4h4M4 9h4V5M20 15h-4v4" />,
  Expand:   (p) => <Icon {...p} d="M4 14v4h4M20 10V6h-4M14 4h4v4M10 20H6v-4" />,
};

// =========================================================
// AREAS — 14 colors keyed by area id
// =========================================================
const AREAS = {
  "distributed-systems":     { label: "Distributed Systems",     short: "DIST",  color: "var(--area-distributed-systems)" },
  "databases":               { label: "Databases",               short: "DB",    color: "var(--area-databases)" },
  "networking":              { label: "Networking",              short: "NET",   color: "var(--area-networking)" },
  "storage":                 { label: "Storage",                 short: "STOR",  color: "var(--area-storage)" },
  "messaging":               { label: "Messaging",               short: "MSG",   color: "var(--area-messaging)" },
  "caching":                 { label: "Caching",                 short: "CACHE", color: "var(--area-caching)" },
  "reliability":             { label: "Reliability",             short: "REL",   color: "var(--area-reliability)" },
  "architecture-patterns":   { label: "Architecture Patterns",   short: "ARCH",  color: "var(--area-architecture-patterns)" },
  "design-patterns":         { label: "Design Patterns",         short: "DP",    color: "var(--area-design-patterns)" },
  "software-engineering":    { label: "Software Engineering",    short: "SWE",   color: "var(--area-software-engineering)" },
  "data-engineering":        { label: "Data Engineering",        short: "DE",    color: "var(--area-data-engineering)" },
  "ml-systems":              { label: "ML Systems",              short: "ML",    color: "var(--area-ml-systems)" },
  "system-design-interview": { label: "System Design Interview", short: "SDI",   color: "var(--area-system-design-interview)" },
  "case-studies":            { label: "Case Studies",            short: "CASE",  color: "var(--area-case-studies)" },
};
const AREA_ORDER = Object.keys(AREAS);

// =========================================================
// MOCK DATA — swap with API later
// =========================================================
const MOCK_HEALTH = {
  backends: { qwen: true, claude: true, gemini: false },
  vault: { pages: 312 },
};

const MOCK_VAULT_STATS = {
  total: 312,
  promotedToday: 7,
  promotedWeek: 31,
  lintWarnings: 4,
  lintBroken: 0,
  streakDays: 41,
};

// Per-area coverage (% mature/comprehensive) — drives rings
const MOCK_AREA_COVERAGE = [
  { area: "distributed-systems",     pct: 78, total: 34, mature: 27 },
  { area: "databases",               pct: 62, total: 41, mature: 25 },
  { area: "networking",              pct: 84, total: 22, mature: 19 },
  { area: "storage",                 pct: 41, total: 17, mature: 7  },
  { area: "messaging",               pct: 55, total: 19, mature: 10 },
  { area: "caching",                 pct: 71, total: 14, mature: 10 },
  { area: "reliability",             pct: 33, total: 21, mature: 7  },
  { area: "architecture-patterns",   pct: 68, total: 28, mature: 19 },
  { area: "design-patterns",         pct: 80, total: 25, mature: 20 },
  { area: "software-engineering",    pct: 47, total: 30, mature: 14 },
  { area: "data-engineering",        pct: 22, total: 18, mature: 4  },
  { area: "ml-systems",              pct: 15, total: 12, mature: 2  },
  { area: "system-design-interview", pct: 58, total: 19, mature: 11 },
  { area: "case-studies",            pct: 36, total: 12, mature: 4  },
];

// Last 5 promoted notes
const MOCK_RECENT_PROMOTED = [
  { page: "consensus/raft-leader-election.md",  title: "Raft Leader Election",            area: "distributed-systems",     status: "mature",        decision: "EXTEND", when: "4m ago" },
  { page: "db/lsm-vs-btree.md",                 title: "LSM Trees vs B-Trees",            area: "databases",               status: "comprehensive", decision: "EXTEND", when: "17m ago" },
  { page: "patterns/cqrs-event-sourcing.md",    title: "CQRS + Event Sourcing",           area: "architecture-patterns",   status: "draft",         decision: "CREATE", when: "1h ago" },
  { page: "messaging/exactly-once-kafka.md",    title: "Exactly-Once in Kafka",           area: "messaging",               status: "mature",        decision: "EXTEND", when: "2h ago" },
  { page: "reliability/circuit-breakers.md",    title: "Circuit Breakers",                area: "reliability",             status: "draft",         decision: "CREATE", when: "Yesterday" },
];

// Today's focus
const MOCK_TODAY_FOCUS = [
  { page: "consensus/paxos-vs-raft.md",         title: "Paxos vs Raft — when each wins",  area: "distributed-systems", status: "draft",         reason: "weakest in distributed/consensus" },
  { page: "db/wal-and-replication.md",          title: "Write-Ahead Log & Replication",   area: "databases",           status: "mature",        reason: "due for review (last touched 9d)" },
  { page: "ml-systems/feature-stores.md",       title: "Feature Stores: online + offline", area: "ml-systems",         status: "stub",          reason: "ml-systems coverage at 15%" },
];

// Session this session
const MOCK_SESSION = {
  startedAt: "09:42",
  elapsedMin: 47,
  queries: 12,
  promotions: 4,
  retrievals: 38,
  history: [
    { id: "q1", q: "How does Raft handle network partitions?", when: "47m" },
    { id: "q2", q: "Difference between leader election in Raft vs Paxos",  when: "39m" },
    { id: "q3", q: "What's the trade-off between strong and eventual consistency in a payment system?", when: "31m" },
    { id: "q4", q: "When would I pick LSM over B-Tree for the primary store?", when: "18m" },
    { id: "q5", q: "Show me how exactly-once works in Kafka producers", when: "8m" },
  ],
  retrieved: [
    { page: "consensus/raft.md",                  title: "Raft",                          area: "distributed-systems", status: "comprehensive", score: 0.91 },
    { page: "consensus/paxos.md",                 title: "Paxos",                         area: "distributed-systems", status: "mature",        score: 0.84 },
    { page: "messaging/kafka-exactly-once.md",    title: "Kafka Exactly-Once",            area: "messaging",           status: "mature",        score: 0.78 },
    { page: "messaging/idempotent-producers.md",  title: "Idempotent Producers",          area: "messaging",           status: "draft",         score: 0.71 },
    { page: "db/lsm-tree.md",                     title: "LSM Tree",                      area: "databases",           status: "mature",        score: 0.69 },
    { page: "db/btree.md",                        title: "B-Tree",                        area: "databases",           status: "mature",        score: 0.66 },
  ],
};

// Live study conversation (one Q with streamed answer + sources)
const MOCK_STUDY_THREAD = {
  question: "Walk me through how Kafka achieves exactly-once delivery — producer-side and end-to-end. Where does it actually break in practice?",
  backend:  { name: "Claude Sonnet 4", primary: true },
  answer: `Kafka's "exactly-once" is really three guarantees stacked together. None of them are exactly-once on their own — the magic is in the composition.

**1 — Idempotent producers.** Each producer is assigned a PID, and every (PID, partition) carries a monotonically increasing sequence number. The broker drops any message whose sequence has already been seen. This eliminates duplicates from producer retries on the *write* path, but only within a single producer session.

**2 — Transactional writes across partitions.** A producer opens a transaction, writes to N partitions (including the consumer-offsets topic), and commits atomically via the transaction coordinator. Consumers configured with \`read_committed\` only see records once the commit marker lands.

**3 — Consume-process-produce loops.** Real exactly-once almost always means "read from topic A, transform, write to topic B, commit the offset" all inside the same transaction. The offset commit and the output writes share a transactional fate.

**Where it breaks in practice:**
- **External side effects.** If your transform calls a database or an HTTP API, Kafka can't roll those back. You need idempotency keys downstream.
- **Long-running transactions** can be aborted by the coordinator's \`transaction.timeout.ms\`, leaving the consumer to reprocess.
- **Zombie producers** after a JVM pause can be fenced by epoch, but only if you use the same \`transactional.id\` across restarts.`,
  sources: [
    { page: "messaging/kafka-exactly-once.md",       title: "Kafka Exactly-Once",       area: "messaging",           status: "mature",        score: 0.93, matched_sections: ["Transactional writes","Producer PID + sequence"], snippet: "Kafka's exactly-once is the composition of idempotent producers and transactional writes…", via: "retrieval" },
    { page: "messaging/idempotent-producers.md",     title: "Idempotent Producers",     area: "messaging",           status: "mature",        score: 0.87, matched_sections: ["PID assignment"],                              snippet: "Each producer is assigned a PID by the transaction coordinator on init…",                via: "retrieval" },
    { page: "messaging/transaction-coordinator.md",  title: "Transaction Coordinator",  area: "messaging",           status: "draft",         score: 0.79, matched_sections: ["Commit markers"],                              snippet: "The coordinator persists transaction state in __transaction_state…",                      via: "retrieval" },
    { page: "patterns/idempotency-keys.md",          title: "Idempotency Keys",         area: "design-patterns",     status: "comprehensive", score: 0.74, matched_sections: ["Downstream HTTP idempotency"],                  snippet: "When the side effect is external, the producer alone cannot guarantee…",                  via: "graph" },
    { page: "reliability/at-least-once-vs-exactly-once.md", title: "At-least-once vs Exactly-once", area: "reliability", status: "mature", score: 0.71, matched_sections: ["Composition"], snippet: "Exactly-once delivery is a misnomer; what's actually achieved is exactly-once processing…", via: "graph" },
    { page: "messaging/consumer-isolation.md",       title: "Consumer Isolation Levels", area: "messaging",          status: "draft",         score: 0.66, matched_sections: ["read_committed"],                              snippet: "Consumers configured with read_committed will skip records inside aborted transactions…",  via: "retrieval" },
  ],
  vaultGap: { area: "messaging", desc: "No note on producer fencing / zombie epochs — comes up in 3 of the 6 sources but is never the primary topic." },
};

// Mock promote proposal
const MOCK_PROMOTE_PROPOSAL = {
  decision: "EXTEND",
  reason:   "The answer describes the consume-process-produce transaction loop with concrete operational failures. This is a substantial extension to an existing mature note — not a new note.",
  promotion_type: "ROW_TO_EXISTING",
  target_title:   "Kafka Exactly-Once",
  target_section: "## Where it breaks in practice",
  merge_strategy: "ADD_SUBSECTION",
  new_content: `### Composition failure modes

- **External side effects.** Kafka transactions cannot roll back database or HTTP calls inside the transform. Downstream services must accept an idempotency key derived from \`(input.topic, input.partition, input.offset)\` so retries collapse.
- **Long transactions** can be aborted by \`transaction.timeout.ms\` (default 60s), leaving the consumer to reprocess. Keep transforms short, or commit incrementally.
- **Zombie fencing.** A producer that pauses past \`transaction.timeout.ms\` and resumes will be fenced by epoch — but *only* if it reuses the same \`transactional.id\`. Auto-generated IDs defeat fencing.

See also: [[Idempotency Keys]], [[Transaction Coordinator]]`,
  wikilinks: ["Idempotency Keys", "Transaction Coordinator"],
  conflicts_with: ["messaging/exactly-once-myths.md"],
  conflict_description: "Existing note 'Exactly-Once Myths' states that long transactions are 'always safe up to 15 minutes' — contradicts this addition's 60s default warning.",
};

// =========================================================
// PRIMITIVES
// =========================================================
const StatusBadge = ({ status }) => (
  <span className={`sbadge sbadge--${status}`}>{status}</span>
);

const AreaDot = ({ area, size = 8 }) => (
  <span className="area-dot" style={{ width: size, height: size, background: AREAS[area]?.color }} />
);

const AreaChip = ({ area, showLabel = true }) => (
  <span className="area-chip">
    <AreaDot area={area} />
    {showLabel && <span style={{ color: "var(--text-body)" }}>{AREAS[area].label}</span>}
  </span>
);

const SourceChip = ({ src, onClick }) => (
  <button className="src-chip" onClick={() => onClick && onClick(src)}>
    <AreaDot area={src.area} />
    <span className="ttl">{src.title}</span>
    <StatusBadge status={src.status} />
    <span className="scr t-mono">{(src.score * 100).toFixed(0)}</span>
    {src.via === "graph" && <span className="via">graph</span>}
  </button>
);

const Card = ({ title, glyph, right, accent, children, className = "", noBody = false }) => (
  <div className={`card ${accent ? "card--accent" : ""} ${className}`}>
    {(title || right) && (
      <div className="card__head">
        <div className="card__title">
          {accent && <span className="dot" />}
          {glyph && <span style={{ display: "inline-flex", color: "var(--text-faint)" }}>{glyph}</span>}
          {title}
        </div>
        {right && <div className="card__right">{right}</div>}
      </div>
    )}
    {noBody ? children : <div className="card__body">{children}</div>}
  </div>
);

// =========================================================
// RING (coverage chart) — SVG, no recharts dep
// =========================================================
const Ring = ({ pct, color, size = 56, stroke = 5, label, sub }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(100, pct)) / 100);
  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(148,158,200,0.10)" strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
          transform={`rotate(-90 ${size/2} ${size/2})`}
          style={{ filter: `drop-shadow(0 0 4px ${color})`, transition: "stroke-dashoffset 1.2s var(--easing-out)" }}
        />
      </svg>
      <div style={{
        position: "absolute", inset: 0, display: "grid", placeItems: "center",
        fontFamily: "var(--font-mono)", fontSize: 11, fontVariantNumeric: "tabular-nums",
        color: "var(--text-hi)", letterSpacing: "-0.02em",
      }}>{pct}</div>
    </div>
  );
};

// =========================================================
// Sparkline (mini SVG)
// =========================================================
const Sparkline = ({ data, color = "var(--accent)", w = 120, h = 32 }) => {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - ((v - min) / range) * (h - 4) - 2]);
  const dLine = pts.map((p, i) => (i === 0 ? `M${p[0]},${p[1]}` : `L${p[0]},${p[1]}`)).join(" ");
  const dArea = `${dLine} L${w},${h} L0,${h} Z`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`sg-${color}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%"  stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={dArea}  fill={`url(#sg-${color})`} />
      <path d={dLine}  fill="none" stroke={color} strokeWidth="1.25" />
    </svg>
  );
};

// =========================================================
// MarkdownView — render vault markdown as formatted notes
// (no dependency; handles headings, bold/italic, lists, tables,
//  fenced code blocks / ASCII diagrams, blockquotes, wikilinks, hr)
// =========================================================
const _mdInlineStyle = {
  code: { fontFamily: "var(--font-mono)", fontSize: "0.88em", padding: "1px 5px", background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: 3, color: "var(--accent-hi)" },
  pre: { fontFamily: "var(--font-mono)", fontSize: 12, lineHeight: 1.5, padding: "12px 14px", background: "var(--bg-deep)", border: "1px solid var(--border)", borderRadius: 6, overflowX: "auto", margin: "10px 0", color: "var(--text-body)", whiteSpace: "pre" },
  table: { borderCollapse: "collapse", width: "100%", margin: "10px 0", fontSize: 12.5 },
  th: { textAlign: "left", padding: "7px 10px", borderBottom: "1px solid var(--border-strong)", color: "var(--text-hi)", fontWeight: 600, background: "rgba(148,158,200,0.04)" },
  td: { padding: "7px 10px", borderBottom: "1px solid var(--border)", color: "var(--text-body)", verticalAlign: "top" },
};

const _mdSplitRow = (line) =>
  line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((s) => s.trim());

const _mdInline = (s) => {
  const out = []; let k = 0; let rest = s;
  const re = /(\*\*[^*]+\*\*|\*[^*\n]+\*|`[^`]+`|\[\[[^\]]+\]\]|\[[^\]]+\]\([^)]+\))/;
  while (rest) {
    const m = re.exec(rest);
    if (!m) { out.push(rest); break; }
    if (m.index > 0) out.push(rest.slice(0, m.index));
    const t = m[0];
    if (t.startsWith("**")) out.push(<b key={k++} style={{ color: "var(--text-hi)", fontWeight: 600 }}>{t.slice(2, -2)}</b>);
    else if (t.startsWith("`")) out.push(<code key={k++} style={_mdInlineStyle.code}>{t.slice(1, -1)}</code>);
    else if (t.startsWith("[[")) out.push(<span key={k++} style={{ color: "var(--accent-hi)", fontFamily: "var(--font-mono)", fontSize: "0.9em" }}>{t}</span>);
    else if (t.startsWith("[")) { const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t); out.push(<a key={k++} href={mm[2]} target="_blank" rel="noreferrer" style={{ color: "var(--accent-hi)" }}>{mm[1]}</a>); }
    else out.push(<i key={k++}>{t.slice(1, -1)}</i>);
    rest = rest.slice(m.index + t.length);
  }
  return out;
};

const MarkdownView = ({ text }) => {
  const lines = (text || "").replace(/\r\n/g, "\n").split("\n");
  const blocks = []; let i = 0;
  const SPECIAL = /^(#{1,4}\s|```|\s*([-*]|\d+\.)\s|>|\|)/;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      const buf = []; i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) { buf.push(lines[i]); i++; }
      i++;
      blocks.push(<pre key={blocks.length} style={_mdInlineStyle.pre}>{buf.join("\n")}</pre>);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(line);
    if (h) {
      const lvl = h[1].length;
      const size = { 1: 21, 2: 16.5, 3: 14, 4: 13 }[lvl] || 13;
      blocks.push(<div key={blocks.length} style={{ color: "var(--text-hi)", fontWeight: 600, fontSize: size, margin: lvl <= 2 ? "20px 0 8px" : "14px 0 6px", letterSpacing: "-0.01em", borderBottom: lvl === 1 ? "1px solid var(--border)" : "none", paddingBottom: lvl === 1 ? 6 : 0 }}>{_mdInline(h[2])}</div>);
      i++; continue;
    }
    if (line.trim().startsWith("|") && i + 1 < lines.length && lines[i + 1].includes("-") && /^[\s:|-]+$/.test(lines[i + 1].trim())) {
      const header = _mdSplitRow(line); i += 2; const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) { rows.push(_mdSplitRow(lines[i])); i++; }
      blocks.push(
        <table key={blocks.length} style={_mdInlineStyle.table}>
          <thead><tr>{header.map((c, j) => <th key={j} style={_mdInlineStyle.th}>{_mdInline(c)}</th>)}</tr></thead>
          <tbody>{rows.map((r, ri) => <tr key={ri}>{r.map((c, ci) => <td key={ci} style={_mdInlineStyle.td}>{_mdInline(c)}</td>)}</tr>)}</tbody>
        </table>);
      continue;
    }
    if (/^\s*([-*]|\d+\.)\s+/.test(line)) {
      const items = []; const ordered = /^\s*\d+\.\s/.test(line);
      while (i < lines.length && /^\s*([-*]|\d+\.)\s+/.test(lines[i])) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, "")); i++; }
      const Tag = ordered ? "ol" : "ul";
      blocks.push(<Tag key={blocks.length} style={{ margin: "4px 0 12px", paddingLeft: 22 }}>{items.map((it, j) => <li key={j} style={{ marginBottom: 5, color: "var(--text-body)", lineHeight: 1.6 }}>{_mdInline(it)}</li>)}</Tag>);
      continue;
    }
    if (line.trim().startsWith(">")) {
      const buf = [];
      while (i < lines.length && lines[i].trim().startsWith(">")) { buf.push(lines[i].replace(/^\s*>\s?/, "")); i++; }
      blocks.push(<blockquote key={blocks.length} style={{ borderLeft: "3px solid var(--accent-line)", margin: "10px 0", padding: "2px 14px", color: "var(--text-dim)" }}>{_mdInline(buf.join(" "))}</blockquote>);
      continue;
    }
    if (/^\s*([-*_])\1{2,}\s*$/.test(line)) { blocks.push(<hr key={blocks.length} style={{ border: "none", borderTop: "1px solid var(--border)", margin: "16px 0" }} />); i++; continue; }
    if (line.trim() === "") { i++; continue; }
    const buf = [line]; i++;
    while (i < lines.length && lines[i].trim() !== "" && !SPECIAL.test(lines[i]) && !/^\s*([-*_])\1{2,}\s*$/.test(lines[i])) { buf.push(lines[i]); i++; }
    blocks.push(<p key={blocks.length} style={{ margin: "0 0 12px", color: "var(--text-body)", lineHeight: 1.7 }}>{_mdInline(buf.join(" "))}</p>);
  }
  return <div style={{ fontSize: 13.5 }}>{blocks}</div>;
};

// Export to globals
Object.assign(window, {
  Icon, I, AREAS, AREA_ORDER,
  MOCK_HEALTH, MOCK_VAULT_STATS, MOCK_AREA_COVERAGE, MOCK_RECENT_PROMOTED,
  MOCK_TODAY_FOCUS, MOCK_SESSION, MOCK_STUDY_THREAD, MOCK_PROMOTE_PROPOSAL,
  StatusBadge, AreaDot, AreaChip, SourceChip, Card, Ring, Sparkline, MarkdownView,
});
