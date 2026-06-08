/* global React, I, AREAS, AREA_ORDER, StatusBadge, AreaDot, Card, Sparkline */

const { useState, useEffect } = React;

// =========================================================
// MOCK DECK
// =========================================================
const FLASHCARD_DECK = [
  {
    page: "consensus/raft.md",
    area: "distributed-systems",
    question: "In Raft, why does a candidate need to receive votes from a majority of nodes before becoming leader?",
    answer: "Because Raft's safety property — that any committed log entry survives all future leaders — depends on the new leader having seen every committed entry. A majority quorum guarantees that the new leader's log overlaps with the previous majority that committed any past entry, so it cannot be missing committed history.",
    deepExplanation: "Concretely: if you commit an entry, you wrote it to a majority. A new leader is elected with votes from a majority. Two majorities of the same set must intersect in at least one node — and that node will refuse to vote for a candidate whose log is behind it (the 'up-to-date' check during RequestVote). So the new leader's log is at least as up-to-date as the most recent committed entry.",
    due: "now", ease: 2.4,
  },
  {
    page: "messaging/kafka-exactly-once.md",
    area: "messaging",
    question: "Kafka producers are configured with `enable.idempotence=true`. What does this *not* protect against?",
    answer: "External side effects performed during the transform stage (DB writes, HTTP calls), and zombie producers that reuse the same transactional.id from a paused JVM without proper fencing.",
    deepExplanation: "Idempotent producers de-duplicate writes within a single (PID, partition, sequence) session — that's it. If your transform calls Stripe, idempotence at the broker doesn't roll back the charge. The pattern is: derive an idempotency key from (input.topic, input.partition, input.offset) and pass it downstream so the side-effect service can dedupe.",
    due: "now", ease: 2.1,
  },
  {
    page: "db/lsm-vs-btree.md",
    area: "databases",
    question: "You're picking storage for a workload that's 95% writes, mostly append-only, with periodic full-range scans. LSM or B-Tree, and why?",
    answer: "LSM. Sequential writes to the MemTable → SSTables minimize write amplification; full-range scans are fine because compacted SSTables are sorted runs you can read in order.",
    deepExplanation: "B-Trees pay random-write cost on every insert (page splits, in-place updates, WAL fsync). LSMs convert random writes into sequential ones via the MemTable + log structure. The cost is read amplification at scan time — but if scans are *full-range* (not point lookups), you read the SSTables sequentially and pay roughly O(N) IO, same as B-tree.",
    due: "now", ease: 2.6,
  },
  {
    page: "patterns/idempotency-keys.md",
    area: "design-patterns",
    question: "What's the difference between an idempotency key and a request ID for retries?",
    answer: "An idempotency key is *client-generated* and *intent-bound* — it represents 'this attempt to do X' and the server uses it to dedupe replays. A request ID is server-generated and identifies the *response*, not the action.",
    deepExplanation: "If the client generates a UUID before sending the request, and the server stores (key → response) for some window, then any retry with the same key returns the cached response without re-executing the side effect. Server-generated request IDs can't do this — by the time you have one, the action already happened.",
    due: "now", ease: 2.3,
  },
  {
    page: "reliability/circuit-breakers.md",
    area: "reliability",
    question: "What's the role of the 'half-open' state in a circuit breaker?",
    answer: "It's a probe state. After the open-timeout expires, the breaker lets a small number of requests through to test if the downstream has recovered. If they succeed, it closes; if they fail, it re-opens.",
    deepExplanation: "Without half-open, you'd either thunder-herd the recovering service the moment the timer fires, or stay open forever. Half-open trades a small risk (the probe requests fail loudly) for a fast detection of recovery without overwhelming the downstream.",
    due: "now", ease: 2.0,
  },
];

const RATING_STEPS = [
  { label: "Again", key: "1", next: "10m",  color: "var(--neon-red)",   sub: "I forgot this" },
  { label: "Hard",  key: "2", next: "1d",   color: "var(--neon-amber)", sub: "Recall was a struggle" },
  { label: "Good",  key: "3", next: "4d",   color: "var(--neon-green)", sub: "Hit the answer" },
  { label: "Easy",  key: "4", next: "9d",   color: "var(--accent-hi)",  sub: "Trivial — defer further" },
];

// =========================================================
// FLASHCARDS
// =========================================================
const Flashcards = () => {
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [deepOpen, setDeepOpen] = useState(false);
  const [reviewed, setReviewed] = useState({ Again: 0, Hard: 0, Good: 0, Easy: 0 });
  const [deck, setDeck] = useState(FLASHCARD_DECK);

  useEffect(() => {
    fetch("/api/flashcards/due?limit=60").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d && Array.isArray(d.cards) && d.cards.length) setDeck(d.cards);
    }).catch(() => {});
  }, []);

  const card = deck[idx % Math.max(1, deck.length)];

  useEffect(() => {
    const h = (e) => {
      if (!revealed) {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setRevealed(true);
        }
      } else {
        if (["1","2","3","4"].includes(e.key)) {
          rate(RATING_STEPS[parseInt(e.key, 10) - 1].label);
        }
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [revealed, idx]);

  const rate = (label) => {
    if (card && card.id != null && window.API) API.post("/api/flashcards/rate", { cardId: card.id, rating: label });
    setReviewed(r => ({ ...r, [label]: r[label] + 1 }));
    setRevealed(false);
    setDeepOpen(false);
    setIdx(i => i + 1);
  };

  const total = deck.length;
  const done  = Object.values(reviewed).reduce((s,n)=>s+n,0);

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Top strip */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
        background: "rgba(15,19,34,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.01em" }}>
            Flashcards
          </h1>
          <span className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
            <b style={{ color: "var(--text-hi)" }}>{done}</b> reviewed · <b style={{ color: "var(--accent-hi)" }}>{total - done}</b> remaining
          </span>
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {RATING_STEPS.map(r => (
              <div key={r.label} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "3px 8px", borderRadius: 4,
                background: "var(--bg-panel)", border: "1px solid var(--border)",
                fontFamily: "var(--font-mono)", fontSize: 10,
                color: "var(--text-dim)",
              }}>
                <span style={{ width: 5, height: 5, borderRadius: "50%", background: r.color, boxShadow: `0 0 5px ${r.color}` }} />
                <span style={{ color: "var(--text)" }}>{r.label}</span>
                <span style={{ color: "var(--text-hi)" }}>{reviewed[r.label]}</span>
              </div>
            ))}
          </div>
          <button className="btn btn--accent btn--sm">
            <I.Sparkle size={11} /> Improve flashcards
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="pbar" style={{ borderRadius: 0, height: 2 }}>
        <i style={{ width: `${(done / total) * 100}%` }} />
      </div>

      {/* Card stage */}
      <div style={{ flex: 1, display: "grid", placeItems: "center", padding: "30px 20px", minHeight: 0, overflow: "auto" }}>
        {done >= total ? (
          <SessionCompleteCard reviewed={reviewed} total={total} onAgain={() => { setReviewed({Again:0,Hard:0,Good:0,Easy:0}); setIdx(0); }} />
        ) : (
          <CardStage
            card={card}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            deepOpen={deepOpen}
            onToggleDeep={() => setDeepOpen(o => !o)}
            onRate={rate}
            idx={idx + 1}
            total={total}
          />
        )}
      </div>
    </div>
  );
};

const CardStage = ({ card, revealed, onReveal, deepOpen, onToggleDeep, onRate, idx, total }) => {
  const def = AREAS[card.area];
  return (
    <div style={{
      width: "min(720px, 100%)",
      background: "var(--bg-card)",
      border: "1px solid var(--border-strong)",
      borderTop: `2px solid ${def.color}`,
      borderRadius: 12,
      padding: "26px 30px",
      boxShadow: "var(--elev-2), 0 0 40px rgba(139,125,255,0.06)",
      position: "relative",
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AreaDot area={card.area} />
          <span className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>{def.label}</span>
          <span style={{ color: "var(--text-faint)" }}>·</span>
          <span className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)" }}>{card.page}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span className="t-mono t-num" style={{ fontSize: 11, color: "var(--text-dim)" }}>EASE {card.ease.toFixed(2)}</span>
          <span className="t-mono t-num" style={{ fontSize: 11, color: "var(--text-hi)" }}>{idx} / {total}</span>
        </div>
      </div>

      {/* Question */}
      <div className="t-label" style={{ marginBottom: 8 }}>QUESTION</div>
      <div style={{ color: "var(--text-hi)", fontSize: 20, fontWeight: 500, lineHeight: 1.45, letterSpacing: "-0.01em", marginBottom: 20, fontFamily: "var(--font-display)" }}>
        {card.question}
      </div>

      {/* Reveal section */}
      {!revealed ? (
        <button onClick={onReveal} style={{
          width: "100%", padding: "18px",
          border: "1px dashed var(--border-strong)", borderRadius: 8,
          background: "rgba(139,125,255,0.03)",
          color: "var(--accent-hi)",
          fontFamily: "var(--font-display)", fontSize: 13, fontWeight: 600, letterSpacing: "0.1em",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
        }}>
          <I.Eye size={16} />
          REVEAL ANSWER
          <span className="t-mono" style={{ fontSize: 10, color: "var(--text-dim)", letterSpacing: "0.06em" }}>SPACE  ·  ENTER</span>
        </button>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Answer */}
          <div>
            <div className="t-label" style={{ marginBottom: 8 }}>ANSWER</div>
            <div style={{ color: "var(--text)", fontSize: 16, lineHeight: 1.6, fontFamily: "var(--font-body)" }}>
              {card.answer}
            </div>
          </div>

          {/* Deep explanation */}
          {card.deepExplanation && (
            <div style={{
              borderTop: "1px dashed var(--border)", paddingTop: 14,
            }}>
              <button onClick={onToggleDeep} style={{
                display: "flex", alignItems: "center", gap: 8,
                color: "var(--accent-hi)", fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: 0.06,
              }}>
                <I.ChevD size={12} style={{ transform: deepOpen ? "none" : "rotate(-90deg)", transition: "transform 150ms" }} />
                DEEP EXPLANATION {deepOpen ? "" : "·  TAP TO EXPAND"}
              </button>
              {deepOpen && (
                <div style={{
                  marginTop: 12, padding: "12px 14px",
                  background: "rgba(139,125,255,0.04)",
                  border: "1px solid var(--accent-line)",
                  borderRadius: 6,
                  color: "var(--text-body)", fontSize: 13.5, lineHeight: 1.6, fontFamily: "var(--font-body)",
                }}>
                  {card.deepExplanation}
                </div>
              )}
            </div>
          )}

          {/* Rate row */}
          <div style={{ marginTop: 8, paddingTop: 14, borderTop: "1px dashed var(--border)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span className="t-label">HOW DID IT GO?</span>
              <span className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>1·2·3·4 KEYS</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 10 }}>
              {RATING_STEPS.map(r => (
                <button key={r.label} onClick={() => onRate(r.label)} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "12px 10px", borderRadius: 8,
                  background: "var(--bg-panel)",
                  border: `1px solid ${r.color}55`,
                  color: "var(--text)",
                  transition: "transform 120ms, border-color 120ms, background 120ms",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = r.color; e.currentTarget.style.background = `color-mix(in oklab, ${r.color} 6%, var(--bg-panel))`; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = `${r.color}55`; e.currentTarget.style.background = "var(--bg-panel)"; }}>
                  <span style={{
                    display: "inline-flex", justifyContent: "center", alignItems: "center",
                    width: 22, height: 22, borderRadius: 4,
                    border: `1px solid ${r.color}88`,
                    fontFamily: "var(--font-mono)", fontSize: 11, color: r.color,
                  }}>{r.key}</span>
                  <span style={{ color: r.color, fontFamily: "var(--font-display)", fontSize: 14, fontWeight: 600, letterSpacing: 0.05 }}>{r.label}</span>
                  <span className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>+{r.next}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SessionCompleteCard = ({ reviewed, total, onAgain }) => {
  const pct = Math.round((reviewed.Good + reviewed.Easy) / total * 100);
  return (
    <div style={{
      width: "min(560px, 100%)",
      background: "var(--bg-card)",
      border: "1px solid var(--accent-line)",
      borderRadius: 12,
      padding: "32px 36px",
      textAlign: "center",
      boxShadow: "var(--elev-2), 0 0 50px rgba(139,125,255,0.15)",
    }}>
      <div style={{
        width: 60, height: 60, borderRadius: 14, margin: "0 auto 18px",
        background: "var(--accent-soft)", border: "1px solid var(--accent-line)",
        display: "grid", placeItems: "center",
      }}>
        <I.Check size={28} stroke="var(--accent-hi)" sw={2} />
      </div>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 22, color: "var(--text-hi)", fontWeight: 600, letterSpacing: "-0.01em" }}>
        Session complete
      </div>
      <div className="t-mono" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
        Reviewed <b style={{ color: "var(--text-hi)" }}>{total}</b> cards · <b style={{ color: "var(--accent-hi)" }}>{pct}%</b> hit-rate
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginTop: 24 }}>
        {RATING_STEPS.map(r => (
          <div key={r.label} style={{ padding: "10px 8px", border: "1px solid var(--border)", borderRadius: 6 }}>
            <div className="t-mono t-num" style={{ fontSize: 22, color: r.color, lineHeight: 1 }}>{reviewed[r.label]}</div>
            <div className="t-label" style={{ marginTop: 4 }}>{r.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22, justifyContent: "center" }}>
        <button className="btn btn--primary" onClick={onAgain}>
          <I.Play size={12} /> Start new session
        </button>
        <button className="btn btn--accent">
          <I.Sparkle size={12} /> Improve flashcards
        </button>
      </div>
    </div>
  );
};

Object.assign(window, { Flashcards });
