/* global React, I, AREAS, AREA_ORDER, StatusBadge, AreaDot, Card, Sparkline */

const { useState } = React;

// =========================================================
// MOCK ROADMAP — milestone-based study plan
// =========================================================
const ROADMAP_MILESTONES = [
  {
    id: "m1", lane: "shipped", title: "Distributed Systems Foundations",
    target: "Q4 2025 · complete",  progress: 100,
    areas: ["distributed-systems", "reliability"],
    cards: [
      { kind: "note",  title: "Raft — comprehensive", status: "comprehensive" },
      { kind: "note",  title: "Vector clocks + causal ordering", status: "mature" },
      { kind: "skill", title: "Explain consensus trade-offs from first principles" },
    ],
    notesPlanned: 24, notesDone: 24,
  },
  {
    id: "m2", lane: "shipped", title: "Storage engines deep-dive",
    target: "Q1 2026 · complete",  progress: 100,
    areas: ["databases", "storage"],
    cards: [
      { kind: "note",  title: "LSM vs B-Tree decision matrix", status: "comprehensive" },
      { kind: "note",  title: "WAL & replication modes",       status: "comprehensive" },
      { kind: "skill", title: "Pick a storage engine for any workload" },
    ],
    notesPlanned: 18, notesDone: 18,
  },
  {
    id: "m3", lane: "current", title: "Streaming & exactly-once semantics",
    target: "Q2 2026 · 8 weeks", progress: 62,
    areas: ["messaging", "design-patterns"],
    cards: [
      { kind: "note",  title: "Kafka exactly-once — composition", status: "mature" },
      { kind: "note",  title: "Idempotency keys",                 status: "comprehensive" },
      { kind: "note",  title: "Transaction coordinator internals", status: "draft", todo: true },
      { kind: "note",  title: "Producer fencing / zombie epochs", status: "stub", todo: true },
    ],
    notesPlanned: 14, notesDone: 9,
  },
  {
    id: "m4", lane: "next", title: "Reliability engineering",
    target: "Q3 2026 · 6 weeks", progress: 18,
    areas: ["reliability", "architecture-patterns"],
    cards: [
      { kind: "note",  title: "Circuit breakers in service meshes", status: "draft" },
      { kind: "note",  title: "Bulkheads + backpressure interaction", status: "stub", todo: true },
      { kind: "drill", title: "Design a payment-processing failure mode runbook" },
    ],
    notesPlanned: 12, notesDone: 3,
  },
  {
    id: "m5", lane: "next", title: "System Design Interview readiness",
    target: "Q3 2026 · 4 weeks", progress: 30,
    areas: ["system-design-interview", "case-studies"],
    cards: [
      { kind: "drill", title: "Design URL shortener — mature" },
      { kind: "drill", title: "Design Tinder",  todo: true },
      { kind: "drill", title: "Design Discord voice", todo: true },
      { kind: "drill", title: "Design Figma collaboration layer", todo: true },
    ],
    notesPlanned: 10, notesDone: 3,
  },
  {
    id: "m6", lane: "later", title: "ML systems & feature stores",
    target: "Q4 2026 · 8 weeks", progress: 6,
    areas: ["ml-systems", "data-engineering"],
    cards: [
      { kind: "note",  title: "Feature stores: online + offline sync", status: "stub", todo: true },
      { kind: "note",  title: "Training/serving skew & shadow models", status: "stub", todo: true },
      { kind: "drill", title: "Design a real-time recommendation system" },
    ],
    notesPlanned: 16, notesDone: 1,
  },
  {
    id: "m7", lane: "later", title: "Case study mastery",
    target: "Q1 2027 · ongoing", progress: 0,
    areas: ["case-studies"],
    cards: [
      { kind: "drill", title: "WhatsApp end-to-end architecture", todo: true },
      { kind: "drill", title: "Cloudflare edge architecture", todo: true },
    ],
    notesPlanned: 12, notesDone: 0,
  },
];

const LANES = [
  { id: "shipped", label: "Shipped",      tone: "var(--neon-green)",   sub: "Mature or comprehensive" },
  { id: "current", label: "In progress",  tone: "var(--accent-hi)",    sub: "Active focus" },
  { id: "next",    label: "Up next",      tone: "var(--neon-cyan)",    sub: "Planned, not started" },
  { id: "later",   label: "Later",        tone: "var(--text-dim)",     sub: "Parked, no date" },
];

// =========================================================
// ROADMAP VIEW
// =========================================================
const Roadmap = () => {
  return (
    <div style={{ height: "100%", overflow: "auto", padding: "18px 24px 60px" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div className="t-label" style={{ marginBottom: 4 }}>ROADMAP · MASTERY PLAN</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.015em" }}>
              The plan
            </h1>
            <div className="t-mono" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
              7 milestones · 2 shipped · 1 in progress · {ROADMAP_MILESTONES.reduce((s,m) => s + (m.notesPlanned - m.notesDone), 0)} notes to write
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--sm"><I.Sparkle size={11} /> Suggest milestone</button>
            <button className="btn btn--sm btn--accent"><I.Plus size={11} /> New milestone</button>
          </div>
        </div>

        {/* Overall progress strip */}
        <div style={{
          padding: "14px 18px",
          background: "var(--bg-panel)",
          border: "1px solid var(--border)",
          borderTop: "1px solid var(--accent-line)",
          borderRadius: 10,
          marginBottom: 20,
          display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 22, alignItems: "center",
        }}>
          <div>
            <div className="t-label">OVERALL PROGRESS</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 2 }}>
              <div className="t-mono t-num" style={{ fontSize: 28, color: "var(--accent-hi)", lineHeight: 1 }}>
                {Math.round(ROADMAP_MILESTONES.reduce((s,m) => s + m.progress, 0) / ROADMAP_MILESTONES.length)}%
              </div>
              <span className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>across milestones</span>
            </div>
          </div>
          <div>
            <div style={{ display: "flex", gap: 4, height: 28 }}>
              {ROADMAP_MILESTONES.map(m => (
                <div key={m.id} title={`${m.title} — ${m.progress}%`} style={{
                  flex: 1, position: "relative",
                  background: "rgba(148,158,200,0.08)",
                  border: "1px solid var(--border)",
                  borderRadius: 4, overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", inset: 0, right: "auto",
                    width: `${m.progress}%`,
                    background: LANES.find(l => l.id === m.lane).tone,
                    opacity: 0.7,
                    boxShadow: m.lane === "current" ? `0 0 6px ${LANES.find(l => l.id === m.lane).tone}` : "none",
                  }} />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "grid", placeItems: "center",
                    fontFamily: "var(--font-mono)", fontSize: 9, color: m.progress > 40 ? "var(--bg-void)" : "var(--text-dim)",
                    letterSpacing: 0.1,
                  }}>{m.progress}%</div>
                </div>
              ))}
            </div>
            <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4, display: "flex", justifyContent: "space-between" }}>
              <span>{ROADMAP_MILESTONES[0].target}</span>
              <span>{ROADMAP_MILESTONES[ROADMAP_MILESTONES.length-1].target}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            {LANES.map(l => {
              const n = ROADMAP_MILESTONES.filter(m => m.lane === l.id).length;
              return (
                <div key={l.id} style={{ textAlign: "right" }}>
                  <div className="t-label" style={{ color: l.tone }}>{l.label}</div>
                  <div className="t-mono t-num" style={{ fontSize: 16, color: "var(--text-hi)" }}>{n}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Kanban-style lanes */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
          {LANES.map(lane => {
            const items = ROADMAP_MILESTONES.filter(m => m.lane === lane.id);
            return (
              <div key={lane.id} style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
                <div style={{
                  padding: "10px 12px",
                  background: "var(--bg-panel)", border: "1px solid var(--border)",
                  borderLeft: `2px solid ${lane.tone}`, borderRadius: 6,
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ color: lane.tone, fontFamily: "var(--font-display)", fontSize: 12, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {lane.label}
                    </span>
                    <span className="t-mono t-num" style={{ fontSize: 11, color: "var(--text-dim)" }}>{items.length}</span>
                  </div>
                  <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{lane.sub}</div>
                </div>

                {items.map(m => <MilestoneCard key={m.id} m={m} laneTone={lane.tone} />)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const MilestoneCard = ({ m, laneTone }) => (
  <div style={{
    padding: 14,
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderTop: `1px solid ${laneTone}33`,
    borderRadius: 8,
    display: "flex", flexDirection: "column", gap: 12,
  }}>
    {/* Title + areas */}
    <div>
      <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
        {m.areas.map(a => <AreaDot key={a} area={a} size={6} />)}
      </div>
      <div style={{ color: "var(--text-hi)", fontSize: 14, fontWeight: 600, lineHeight: 1.3, letterSpacing: "-0.005em" }}>
        {m.title}
      </div>
      <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4 }}>{m.target}</div>
    </div>

    {/* Progress */}
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
        <span className="t-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>
          <b style={{ color: "var(--text-hi)" }}>{m.notesDone}</b>/{m.notesPlanned} notes
        </span>
        <span className="t-mono t-num" style={{ fontSize: 10, color: laneTone }}>{m.progress}%</span>
      </div>
      <div className="pbar"><i style={{ width: `${m.progress}%`, background: laneTone, boxShadow: `0 0 6px ${laneTone}` }} /></div>
    </div>

    {/* Cards (tasks) */}
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {m.cards.map((c, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "14px 1fr auto", gap: 8, alignItems: "center",
          padding: "5px 6px", borderRadius: 4,
          background: c.todo ? "rgba(255,177,61,0.04)" : "transparent",
          border: c.todo ? "1px dashed rgba(255,177,61,0.18)" : "1px solid transparent",
        }}>
          <span style={{
            display: "inline-flex", justifyContent: "center", alignItems: "center",
            width: 14, height: 14, borderRadius: 3,
            background: c.todo ? "transparent" : `${laneTone}33`,
            border: `1px solid ${c.todo ? "var(--neon-amber)" : laneTone}`,
            color: c.todo ? "var(--neon-amber)" : laneTone,
            fontFamily: "var(--font-mono)", fontSize: 9, fontWeight: 700,
          }}>{c.todo ? "" : "✓"}</span>
          <span style={{ color: c.todo ? "var(--text-body)" : "var(--text)", fontSize: 12, lineHeight: 1.35 }}>
            <span className="t-mono" style={{ fontSize: 9, color: "var(--text-faint)", marginRight: 5, letterSpacing: 0.08, textTransform: "uppercase" }}>{c.kind}</span>
            {c.title}
          </span>
          {c.status && <StatusBadge status={c.status} />}
        </div>
      ))}
    </div>
  </div>
);

Object.assign(window, { Roadmap });
