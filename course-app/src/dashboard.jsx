/* global React, I, AREAS, AREA_ORDER,
   MOCK_VAULT_STATS, MOCK_AREA_COVERAGE, MOCK_RECENT_PROMOTED,
   MOCK_TODAY_FOCUS, MOCK_SESSION,
   StatusBadge, AreaDot, AreaChip, Card, Ring, Sparkline */

// =========================================================
// SESSION COLUMN — left of dashboard
// =========================================================
const SessionCard = () => {
  const s = MOCK_SESSION;
  return (
    <Card
      title="Session"
      glyph={<I.Timer size={12} />}
      accent
      right={<span className="t-mono t-faint" style={{ fontSize: 10, letterSpacing: "0.08em" }}>STARTED {s.startedAt}</span>}
    >
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <div className="t-mono t-num" style={{ fontSize: 38, color: "var(--text-hi)", lineHeight: 1, letterSpacing: "-0.02em" }}>
          {s.elapsedMin}<span className="t-faint" style={{ fontSize: 13, marginLeft: 4 }}>min</span>
        </div>
        <div style={{ flex: 1 }}>
          <Sparkline data={[3,5,4,7,8,6,9,12,11,14,12,15,18,16,19,22,24]} color="var(--accent)" w={140} h={28} />
          <div className="t-label" style={{ marginTop: 2 }}>FOCUS TIME · SMOOTH</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--border)" }}>
        <SessionStat n={s.queries}    lbl="QUERIES" />
        <SessionStat n={s.promotions} lbl="PROMOTED" accent />
        <SessionStat n={s.retrievals} lbl="RETRIEVED" />
      </div>

      <button className="btn btn--accent" style={{ width: "100%", justifyContent: "center", marginTop: 14 }}>
        <I.Compile size={13} /> Compile session
        <span className="kbd kbd--inline" style={{ marginLeft: "auto" }}>⌘ ⇧ C</span>
      </button>
    </Card>
  );
};

const SessionStat = ({ n, lbl, accent }) => (
  <div>
    <div className="t-mono t-num" style={{ fontSize: 18, color: accent ? "var(--accent-hi)" : "var(--text-hi)", lineHeight: 1 }}>{n}</div>
    <div className="t-label" style={{ marginTop: 4 }}>{lbl}</div>
  </div>
);

const RecentPromotedCard = () => (
  <Card
    title="Recently promoted"
    glyph={<I.Promote size={12} />}
    right={<span className="t-mono t-faint" style={{ fontSize: 10 }}>LAST 5</span>}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 2, margin: "-4px -4px" }}>
      {MOCK_RECENT_PROMOTED.map((p) => (
        <button key={p.page} style={{
          display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 8,
          padding: "8px 10px",
          borderRadius: 6,
          textAlign: "left",
          transition: "background 120ms",
        }} onMouseEnter={(e) => e.currentTarget.style.background = "rgba(148,158,200,0.04)"}
           onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
          <AreaDot area={p.area} size={6} />
          <div style={{ minWidth: 0 }}>
            <div style={{ color: "var(--text-hi)", fontSize: 12, lineHeight: 1.35, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {p.title}
            </div>
            <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2, letterSpacing: 0.2 }}>
              <span style={{ color: p.decision === "EXTEND" ? "var(--accent-hi)" : "var(--neon-green)" }}>{p.decision}</span>
              <span style={{ color: "var(--text-faint)", margin: "0 5px" }}>·</span>{p.when}
            </div>
          </div>
          <StatusBadge status={p.status} />
        </button>
      ))}
    </div>
  </Card>
);

// =========================================================
// TODAY FOCUS — center column
// =========================================================
const TodayFocus = ({ onStart }) => (
  <Card
    accent
    title="Today's focus"
    glyph={<I.Bolt size={12} />}
    right={<span className="t-label">CURATED · {new Date().toLocaleDateString(undefined,{month:"short",day:"numeric"}).toUpperCase()}</span>}
  >
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {MOCK_TODAY_FOCUS.map((f, i) => (
        <FocusRow key={f.page} i={i} f={f} onStart={onStart} />
      ))}
    </div>

    <div style={{
      display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10,
      marginTop: 18, paddingTop: 16, borderTop: "1px dashed var(--border)",
    }}>
      <button className="btn btn--primary" style={{ justifyContent: "center" }} onClick={() => onStart && onStart("resume")}>
        <I.Play size={11} /> Resume study
        <span className="kbd kbd--inline" style={{ marginLeft: 6, background: "rgba(10,13,24,0.4)", color: "#0a0d18", borderColor: "rgba(0,0,0,0.2)" }}>⏎</span>
      </button>
      <button className="btn" style={{ justifyContent: "center" }} onClick={() => onStart && onStart("new")}>
        <I.Plus size={12} /> New area
      </button>
      <button className="btn" style={{ justifyContent: "center" }} onClick={() => onStart && onStart("cards")}>
        <I.Cards size={12} /> Flashcards <span className="t-mono t-faint" style={{ fontSize: 10, marginLeft: 4 }}>12 due</span>
      </button>
    </div>
  </Card>
);

const FocusRow = ({ i, f, onStart }) => (
  <button onClick={() => onStart && onStart("focus", f)} style={{
    display: "grid", gridTemplateColumns: "20px 1fr auto auto", alignItems: "center", gap: 12,
    padding: "10px 12px",
    background: "var(--bg-card)",
    border: "1px solid var(--border)",
    borderRadius: 8,
    textAlign: "left",
    transition: "border-color 120ms, background 120ms",
  }}
   onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-line)"; e.currentTarget.style.background = "rgba(139,125,255,0.04)"; }}
   onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)";       e.currentTarget.style.background = "var(--bg-card)"; }}>
    <div className="t-mono" style={{ color: "var(--text-faint)", fontSize: 11, fontVariantNumeric: "tabular-nums" }}>0{i+1}</div>
    <div style={{ minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <AreaDot area={f.area} />
        <div style={{ color: "var(--text-hi)", fontSize: 14, fontWeight: 500, letterSpacing: "-0.005em" }}>{f.title}</div>
      </div>
      <div className="t-mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 4 }}>
        {f.page}<span style={{ color: "var(--text-faint)", margin: "0 6px" }}>·</span>{f.reason}
      </div>
    </div>
    <StatusBadge status={f.status} />
    <I.ArrowR size={14} stroke="var(--text-faint)" />
  </button>
);

// =========================================================
// VAULT HEALTH — right column
// =========================================================
const VaultHealth = () => (
  <Card
    title="Vault coverage"
    glyph={<I.Vault size={12} />}
    right={<span className="t-mono t-faint" style={{ fontSize: 10 }}>14 AREAS · % MATURE</span>}
  >
    <div className="vault-areas" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
      {MOCK_AREA_COVERAGE.map((a) => <AreaCoverageRow key={a.area} a={a} />)}
    </div>

    <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      <MicroStat label="PROMOTED THIS WEEK" val={MOCK_VAULT_STATS.promotedWeek} sub="+12 vs last" tone="accent"
        spark={<Sparkline data={[2,4,3,7,5,8,6,9,6,11,8,10,12]} color="var(--accent)" w={60} h={20} />} />
      <MicroStat label="LINT STATUS"        val={MOCK_VAULT_STATS.lintWarnings} sub={`${MOCK_VAULT_STATS.lintBroken} broken · ${MOCK_VAULT_STATS.lintWarnings} warn`} tone="warn"
        spark={<Sparkline data={[8,7,6,9,5,4,3,5,4,3,4,5,4]} color="var(--neon-amber)" w={60} h={20} />} />
    </div>
  </Card>
);

const AreaCoverageRow = ({ a }) => {
  const def = AREAS[a.area];
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "32px 1fr auto", alignItems: "center", gap: 8,
      padding: "8px 10px",
      borderRadius: 6,
      background: "rgba(148,158,200,0.025)",
      border: "1px solid var(--border)",
    }}>
      <Ring pct={a.pct} color={def.color} size={32} stroke={3} />
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "var(--text-hi)", fontSize: 11.5, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {def.label}
        </div>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 1 }}>
          {a.mature}/{a.total}
        </div>
      </div>
      <div style={{ width: 3, alignSelf: "stretch", background: def.color, opacity: 0.5, borderRadius: 1, boxShadow: `0 0 6px ${def.color}` }} />
    </div>
  );
};

const MicroStat = ({ label, val, sub, spark, tone }) => (
  <div style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 6, background: "rgba(148,158,200,0.025)" }}>
    <div className="t-label">{label}</div>
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
      <div className="t-mono t-num" style={{ fontSize: 22, color: tone === "accent" ? "var(--accent-hi)" : tone === "warn" ? "var(--neon-amber)" : "var(--text-hi)" }}>{val}</div>
      {spark}
    </div>
    <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{sub}</div>
  </div>
);

// =========================================================
// BACKEND ROUTING CARD (bottom right)
// =========================================================
const BackendCard = () => (
  <Card
    title="Backend routing"
    glyph={<I.Layers size={12} />}
    right={<span className="t-mono t-faint" style={{ fontSize: 10 }}>HEALTHCHECK 12s</span>}
  >
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
      <BackendBar name="Qwen 2.5"     model="qwen2.5-72b"     state="ok"      role="primary"  load={62} latency="380ms" />
      <BackendBar name="Claude"       model="claude-sonnet-4" state="ok"      role="fallback" load={18} latency="540ms" />
      <BackendBar name="Gemini"       model="gemini-2.5-pro"  state="down"    role="standby"  load={0}  latency="—" />
    </div>
  </Card>
);

const BackendBar = ({ name, model, state, role, load, latency }) => {
  const tone = state === "ok" ? "var(--neon-green)" : state === "down" ? "var(--neon-red)" : "var(--neon-amber)";
  return (
    <div style={{ padding: "10px 12px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg-card)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ color: "var(--text-hi)", fontSize: 12, fontWeight: 500 }}>{name}</div>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: "var(--font-mono)", fontSize: 10, color: tone }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: tone, boxShadow: `0 0 6px ${tone}` }} />
          {state.toUpperCase()}
        </div>
      </div>
      <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{model}</div>
      <div style={{ height: 3, background: "rgba(148,158,200,0.08)", marginTop: 8, position: "relative", borderRadius: 2 }}>
        <div style={{ position: "absolute", inset: 0, width: `${load}%`, background: tone, opacity: 0.6, borderRadius: 2, boxShadow: `0 0 6px ${tone}` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)" }}>
        <span>{role}</span><span>{latency}</span>
      </div>
    </div>
  );
};

// =========================================================
// BOTTOM STRIP — streak + totals
// =========================================================
const BottomStrip = () => (
  <div style={{
    display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr", gap: 12,
  }}>
    <StreakCard />
    <KpiTile label="TOTAL NOTES"      val={MOCK_VAULT_STATS.total} sub="+18 this week" tone="accent" />
    <KpiTile label="MATURE / COMPRE." val={`${Math.round(MOCK_AREA_COVERAGE.reduce((s,a)=>s+a.mature,0))}`} sub={`${Math.round(MOCK_AREA_COVERAGE.reduce((s,a)=>s+a.mature,0)/MOCK_VAULT_STATS.total*100)}% of vault`} />
    <KpiTile label="ORPHAN NOTES"     val="9" sub="link to nearest neighbor →" tone="warn" />
  </div>
);

const StreakCard = () => (
  <Card noBody>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{
          width: 42, height: 42, borderRadius: 10,
          background: "radial-gradient(circle at 30% 20%, rgba(255,177,61,0.25), rgba(255,94,106,0.15))",
          border: "1px solid rgba(255,177,61,0.3)",
          display: "grid", placeItems: "center",
          color: "var(--neon-amber)",
        }}>
          <I.Flame size={20} stroke="var(--neon-amber)" />
        </div>
        <div>
          <div className="t-label">CURRENT STREAK</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <div className="t-mono t-num" style={{ fontSize: 26, color: "var(--text-hi)", lineHeight: 1 }}>{MOCK_VAULT_STATS.streakDays}</div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>days · longest 67</div>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 2 }}>
        {Array.from({length: 21}).map((_,i) => {
          const intensity = [1,1,0.6,1,1,1,0.3,1,0.7,1,1,1,1,0.5,1,1,1,0.9,1,1,1][i] || 0.4;
          return <div key={i} style={{
            width: 10, height: 22, borderRadius: 2,
            background: intensity > 0.6 ? `rgba(139,125,255,${intensity})` : `rgba(148,158,200,${0.06 + intensity*0.08})`,
            boxShadow: intensity > 0.8 ? "0 0 4px rgba(139,125,255,0.5)" : "none",
          }} />;
        })}
      </div>
    </div>
  </Card>
);

const KpiTile = ({ label, val, sub, tone }) => (
  <Card noBody>
    <div style={{ padding: "12px 16px" }}>
      <div className="t-label">{label}</div>
      <div className="t-mono t-num" style={{
        fontSize: 26, lineHeight: 1, marginTop: 4,
        color: tone === "accent" ? "var(--accent-hi)" : tone === "warn" ? "var(--neon-amber)" : "var(--text-hi)",
      }}>{val}</div>
      <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 4 }}>{sub}</div>
    </div>
  </Card>
);

// =========================================================
// CLAUDE SPEND — live from /api/usage (real Claude token cost)
// =========================================================
const _fmtTok = (n) => (n >= 1000 ? (n / 1000).toFixed(1) + "k" : String(n || 0));

const MicroSpend = ({ label, val, tone }) => (
  <div style={{ padding: "8px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "rgba(148,158,200,0.025)" }}>
    <div className="t-label">{label}</div>
    <div className="t-mono t-num" style={{ fontSize: 15, marginTop: 3, color: tone === "accent" ? "var(--accent-hi)" : "var(--text-hi)" }}>{val}</div>
  </div>
);

const ClaudeSpendCard = () => {
  const [u, setU] = React.useState(null);
  React.useEffect(() => {
    let alive = true;
    fetch("/api/usage").then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setU(d); }).catch(() => {});
    return () => { alive = false; };
  }, []);
  const today = (u && u.today) || { cost: 0, calls: 0, input: 0, output: 0 };
  const total = (u && u.total) || { cost: 0 };
  return (
    <Card title="Claude spend" glyph={<I.Bolt size={12} />}
      right={<span className="t-mono t-faint" style={{ fontSize: 10 }}>SONNET · COMPILE</span>}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
        <div className="t-mono t-num" style={{ fontSize: 30, color: "var(--accent-hi)", lineHeight: 1, letterSpacing: "-0.02em" }}>
          ${today.cost.toFixed(2)}
        </div>
        <div className="t-label">TODAY · {today.calls} CALLS</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--border)" }}>
        <MicroSpend label="TOKENS IN / OUT" val={`${_fmtTok(today.input)} / ${_fmtTok(today.output)}`} />
        <MicroSpend label="LIFETIME" val={`$${total.cost.toFixed(2)}`} tone="accent" />
      </div>
    </Card>
  );
};

// =========================================================
// DASHBOARD — root
// =========================================================
const Dashboard = ({ onStart }) => (
  <div className="dash-grid" style={{
    display: "grid",
    gridTemplateColumns: "300px 1fr 360px",
    gridTemplateRows: "auto auto",
    gap: 14,
    padding: 14,
    height: "100%",
    overflow: "auto",
  }}>
    {/* Header strip spans all cols */}
    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "4px 4px 0" }}>
      <div>
        <div className="t-label" style={{ marginBottom: 4 }}>COCKPIT · DAY {MOCK_VAULT_STATS.streakDays}</div>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.015em" }}>
          Good morning. <span style={{ color: "var(--text-dim)" }}>Vault is at <span style={{ color: "var(--accent-hi)" }}>312 notes</span>.</span>
        </h1>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <button className="btn btn--sm">
          <I.Sparkle size={11} /> Suggest a new direction
        </button>
        <button className="btn btn--sm btn--accent">
          <I.Pin size={11} /> Pin a focus
        </button>
      </div>
    </div>

    {/* Row 1 — three columns */}
    <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
      <SessionCard />
      <ClaudeSpendCard />
      <RecentPromotedCard />
    </div>
    <div style={{ minWidth: 0 }}>
      <TodayFocus onStart={onStart} />
    </div>
    <div className="dash-vault" style={{ minWidth: 0 }}>
      <VaultHealth />
    </div>

    {/* Row 2 — bottom strip + backend (spans 2/3 cols) */}
    <div className="dash-strip" style={{ gridColumn: "1 / 3", minWidth: 0 }}>
      <BottomStrip />
    </div>
    <div className="dash-backend" style={{ minWidth: 0 }}>
      <BackendCard />
    </div>
  </div>
);

Object.assign(window, { Dashboard });
