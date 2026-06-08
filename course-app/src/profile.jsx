/* global React, I, Card, StatusBadge, AreaDot, Sparkline */

const { useState, useEffect, useRef } = React;

// =========================================================
// MOCK DATA — profile defaults
// =========================================================
const DEFAULT_BACKENDS = [
  {
    id: "qwen", name: "Qwen 2.5",
    provider: "Qwen / Alibaba",
    model: "qwen2.5-72b-instruct",
    keyMasked: "sk-qw-xxxxxxxxxxxxxxxxxxxxxx9f2a",
    endpoint: "https://dashscope.aliyuncs.com/v1",
    enabled: true, role: "primary",
    state: "ok", latencyMs: 384, lastCheck: "12s ago",
    contextWindow: 128_000, costIn: 0.40, costOut: 1.20,
  },
  {
    id: "claude", name: "Claude Sonnet 4",
    provider: "Anthropic",
    model: "claude-sonnet-4-20250514",
    keyMasked: "sk-ant-api03-xxxxxxxxxxxxxxxxxxxxxx-fAa9c",
    endpoint: "https://api.anthropic.com/v1",
    enabled: true, role: "fallback",
    state: "ok", latencyMs: 540, lastCheck: "12s ago",
    contextWindow: 200_000, costIn: 3.00, costOut: 15.00,
  },
  {
    id: "gemini", name: "Gemini 2.5 Pro",
    provider: "Google",
    model: "gemini-2.5-pro",
    keyMasked: "",
    endpoint: "https://generativelanguage.googleapis.com/v1beta",
    enabled: false, role: "standby",
    state: "missing", latencyMs: null, lastCheck: "—",
    contextWindow: 2_000_000, costIn: 1.25, costOut: 10.00,
  },
  {
    id: "gpt", name: "GPT-4.1",
    provider: "OpenAI",
    model: "gpt-4.1",
    keyMasked: "sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx-Lb7e",
    endpoint: "https://api.openai.com/v1",
    enabled: false, role: "standby",
    state: "idle", latencyMs: 612, lastCheck: "3h ago",
    contextWindow: 1_000_000, costIn: 2.00, costOut: 8.00,
  },
  {
    id: "local", name: "Llama 3.3 (local)",
    provider: "Ollama @ localhost:11434",
    model: "llama3.3:70b",
    keyMasked: "—",
    endpoint: "http://localhost:11434/v1",
    enabled: true, role: "embed-only",
    state: "ok", latencyMs: 92, lastCheck: "12s ago",
    contextWindow: 32_000, costIn: 0.00, costOut: 0.00,
  },
];

// =========================================================
// LLM BACKENDS — main control panel
// =========================================================
const BackendsCard = () => {
  const [backends, setBackends] = useState(DEFAULT_BACKENDS);
  useEffect(() => {
    fetch("/api/config").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (d && Array.isArray(d.backends)) setBackends(d.backends);
    }).catch(() => {});
  }, []);
  const [revealKey, setRevealKey] = useState({});
  const [probing, setProbing] = useState(false);
  const [probingIds, setProbingIds] = useState(new Set());

  const toggle = (id, k) => setBackends(bs => bs.map(b => b.id === id ? { ...b, [k]: !b[k] } : b));
  const setRole = (id, role) => setBackends(bs => bs.map(b => b.id === id ? { ...b, role } : b));

  const probe = (ids) => {
    setProbing(true);
    setProbingIds(new Set(ids));
    setBackends(bs => bs.map(b => ids.includes(b.id) ? { ...b, state: "checking" } : b));
    // simulate staggered probe
    ids.forEach((id, i) => {
      setTimeout(() => {
        setBackends(bs => bs.map(b => {
          if (b.id !== id) return b;
          // Random-ish outcomes by current state
          if (!b.keyMasked) return { ...b, state: "missing", latencyMs: null, lastCheck: "now" };
          if (b.id === "gemini") return { ...b, state: "missing", latencyMs: null, lastCheck: "now" };
          const lat = Math.round(80 + Math.random() * 700);
          return { ...b, state: "ok", latencyMs: lat, lastCheck: "now" };
        }));
        setProbingIds(p => { const n = new Set(p); n.delete(id); return n; });
        if (i === ids.length - 1) setTimeout(() => setProbing(false), 200);
      }, 400 + i * 280);
    });
  };

  const okCount = backends.filter(b => b.state === "ok" && b.enabled).length;
  const enabledCount = backends.filter(b => b.enabled).length;

  return (
    <Card
      accent
      title="LLM Backends"
      glyph={<I.Layers size={12} />}
      right={
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
            {okCount}/{enabledCount} HEALTHY · {backends.length} CONFIGURED
          </span>
          <button className="btn btn--accent btn--sm" onClick={() => probe(backends.map(b => b.id))} disabled={probing}>
            <I.Sparkle size={11} /> {probing ? "Probing…" : "Probe all"}
          </button>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {backends.map(b => (
          <BackendRow
            key={b.id} b={b}
            revealed={revealKey[b.id]}
            onReveal={() => setRevealKey(r => ({ ...r, [b.id]: !r[b.id] }))}
            onToggle={() => toggle(b.id, "enabled")}
            onRoleChange={(role) => setRole(b.id, role)}
            onProbe={() => probe([b.id])}
            isProbing={probingIds.has(b.id)}
          />
        ))}
      </div>

      <div style={{
        marginTop: 14, paddingTop: 12, borderTop: "1px dashed var(--border)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
          Keys are stored encrypted in <span style={{ color: "var(--text-hi)" }}>~/.sda/keys.json</span> with OS keychain backing.
        </div>
        <button className="btn btn--sm">
          <I.Plus size={11} /> Add backend
        </button>
      </div>
    </Card>
  );
};

const BackendRow = ({ b, revealed, onReveal, onToggle, onRoleChange, onProbe, isProbing }) => {
  const stateTone = {
    ok:       "var(--neon-green)",
    checking: "var(--neon-cyan)",
    idle:     "var(--text-dim)",
    missing:  "var(--neon-amber)",
    down:     "var(--neon-red)",
  }[b.state];
  const stateLabel = {
    ok: "HEALTHY", checking: "CHECKING…", idle: "UNTESTED", missing: "NO KEY", down: "DOWN",
  }[b.state];

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "200px 1fr 140px 100px auto",
      gap: 12, alignItems: "center",
      padding: "10px 12px",
      background: b.enabled ? "var(--bg-card)" : "rgba(148,158,200,0.025)",
      border: "1px solid var(--border)",
      borderLeft: `2px solid ${b.enabled ? stateTone : "var(--border-strong)"}`,
      borderRadius: 6,
      opacity: b.enabled ? 1 : 0.6,
      transition: "opacity 150ms, border-color 150ms",
    }}>
      {/* Identity */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: 2, background: stateTone, boxShadow: b.state === "ok" || b.state === "checking" ? `0 0 6px ${stateTone}` : "none", animation: b.state === "checking" ? "pulseDot 0.9s ease-in-out infinite" : "none" }} />
          <div style={{ color: "var(--text-hi)", fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em" }}>{b.name}</div>
        </div>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 3 }}>
          {b.provider} · {b.model}
        </div>
      </div>

      {/* API key */}
      <div>
        <div className="t-label" style={{ marginBottom: 4 }}>API KEY</div>
        <div className="input-wrap">
          <input
            className="input input--key"
            type={revealed ? "text" : "password"}
            defaultValue={b.keyMasked}
            placeholder="Paste API key…"
          />
          <button className="eye" onClick={onReveal} title={revealed ? "Hide" : "Reveal"}>
            <I.Eye size={12} />
          </button>
        </div>
      </div>

      {/* Role */}
      <div>
        <div className="t-label" style={{ marginBottom: 4 }}>ROLE</div>
        <select className="select" value={b.role} onChange={(e) => onRoleChange(e.target.value)}>
          <option value="primary">primary</option>
          <option value="fallback">fallback</option>
          <option value="standby">standby</option>
          <option value="embed-only">embed-only</option>
        </select>
      </div>

      {/* Latency */}
      <div>
        <div className="t-label" style={{ marginBottom: 4 }}>{stateLabel}</div>
        <div className="t-mono t-num" style={{ fontSize: 14, color: b.state === "ok" ? "var(--text-hi)" : "var(--text-dim)" }}>
          {b.latencyMs ? `${b.latencyMs}ms` : "—"}
        </div>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>{b.lastCheck}</div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <button className="btn btn--ghost btn--sm" onClick={onProbe} title="Probe this backend">
          {isProbing ? <I.Sparkle size={11} stroke="var(--accent)" /> : <I.Bolt size={11} />}
        </button>
        <div className={`toggle ${b.enabled ? "on" : ""}`} onClick={onToggle} title={b.enabled ? "Disable" : "Enable"} />
      </div>
    </div>
  );
};

// =========================================================
// ROUTING POLICY
// =========================================================
const RoutingCard = () => {
  const [policy, setPolicy] = useState("quality-first");
  const chains = {
    "quality-first": ["claude", "qwen", "gpt"],
    "cost-first":    ["qwen", "local", "gpt"],
    "latency-first": ["local", "qwen", "claude"],
    "manual":        ["qwen", "claude", "gpt"],
  };
  const chain = chains[policy];

  return (
    <Card
      title="Routing policy"
      glyph={<I.ArrowR size={12} />}
      right={
        <select className="select" value={policy} onChange={(e) => setPolicy(e.target.value)} style={{ marginRight: -4 }}>
          <option value="quality-first">quality-first</option>
          <option value="cost-first">cost-first</option>
          <option value="latency-first">latency-first</option>
          <option value="manual">manual</option>
        </select>
      }
    >
      <div className="section-sub" style={{ marginTop: 0, marginBottom: 14 }}>
        Order in which backends are tried per query. Failure or rate-limit on one falls through to the next.
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 0, flexWrap: "wrap" }}>
        {chain.map((id, i) => {
          const b = DEFAULT_BACKENDS.find(x => x.id === id);
          return (
            <React.Fragment key={id}>
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px",
                background: i === 0 ? "var(--accent-soft)" : "var(--bg-card)",
                border: `1px solid ${i === 0 ? "var(--accent-line)" : "var(--border)"}`,
                borderRadius: 6,
              }}>
                <div className="t-mono" style={{ fontSize: 9, color: "var(--text-faint)", letterSpacing: "0.1em" }}>
                  {["PRIMARY", "FALLBACK", "STANDBY"][i] || "STANDBY"}
                </div>
                <div style={{ color: "var(--text-hi)", fontSize: 13, fontWeight: 500 }}>{b?.name || id}</div>
                <span className="t-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>{b?.latencyMs}ms</span>
              </div>
              {i < chain.length - 1 && <I.ChevR size={14} stroke="var(--text-faint)" style={{ margin: "0 6px" }} />}
            </React.Fragment>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 14 }}>
        <Toggle label="Auto-retry on rate-limit"   defaultOn />
        <Toggle label="Cache identical queries (24h)" defaultOn />
        <Toggle label="Stream tokens through fallback" defaultOn={false} />
      </div>
    </Card>
  );
};

const Toggle = ({ label, defaultOn = false }) => {
  const [on, setOn] = useState(defaultOn);
  return (
    <button onClick={() => setOn(o => !o)} style={{
      display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
      padding: "10px 12px", borderRadius: 6,
      background: "var(--bg-card)", border: "1px solid var(--border)",
      textAlign: "left", color: "var(--text)", fontSize: 12,
    }}>
      <span style={{ color: "var(--text-hi)" }}>{label}</span>
      <div className={`toggle ${on ? "on" : ""}`} />
    </button>
  );
};

// =========================================================
// VAULT & SYNC
// =========================================================
const VaultSyncCard = () => {
  const [syncing, setSyncing] = useState(false);
  const [progress, setProgress] = useState(0);

  const sync = () => {
    setSyncing(true); setProgress(0);
    let p = 0;
    const t = setInterval(() => {
      p += Math.random() * 14 + 6;
      if (p >= 100) { p = 100; clearInterval(t); setTimeout(() => setSyncing(false), 600); }
      setProgress(p);
    }, 220);
  };

  return (
    <Card title="Vault & sync" glyph={<I.Vault size={12} />}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <Field label="VAULT PATH"   value="/Users/aman/Obsidian/SystemDesign" mono />
        <Field label="REMOTE"       value="git@github.com:aman/sysdesign-vault.git" mono />
        <Field label="LAST SYNC"    value="14 minutes ago · 3 incoming" />
        <Field label="VAULT SIZE"   value="312 notes · 7.4 MB · 1,847 wikilinks" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 16 }}>
        <button className="btn btn--accent" style={{ justifyContent: "center" }} onClick={sync} disabled={syncing}>
          <I.ArrowU size={12} style={{ transform: syncing ? "rotate(180deg)" : "none", transition: "transform 220ms" }} /> {syncing ? "Syncing…" : "Sync now"}
        </button>
        <button className="btn" style={{ justifyContent: "center" }}>
          <I.Compile size={12} /> Snapshot backup
        </button>
        <button className="btn" style={{ justifyContent: "center" }}>
          <I.File size={12} /> Open vault folder
        </button>
      </div>

      {syncing && (
        <div style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span className="t-label">PUSHING CHANGES</span>
            <span className="t-mono" style={{ fontSize: 10, color: "var(--accent-hi)" }}>{Math.round(progress)}%</span>
          </div>
          <div className="pbar pbar--shimmer"><i style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      <div style={{ marginTop: 16, padding: "10px 12px", background: "rgba(61,255,166,0.04)", border: "1px solid rgba(61,255,166,0.18)", borderRadius: 6, display: "flex", gap: 10, alignItems: "center" }}>
        <I.Check size={13} stroke="var(--neon-green)" />
        <div style={{ flex: 1 }}>
          <div style={{ color: "var(--text-hi)", fontSize: 12 }}>Auto-sync on promote</div>
          <div className="t-mono" style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 2 }}>Every promotion triggers a debounced 5s git commit + push.</div>
        </div>
        <div className="toggle on" />
      </div>
    </Card>
  );
};

const Field = ({ label, value, mono }) => (
  <div>
    <div className="t-label" style={{ marginBottom: 5 }}>{label}</div>
    <input
      defaultValue={value}
      className={mono ? "input" : "input"}
      style={{ fontFamily: mono ? "var(--font-mono)" : "var(--font-body)", fontSize: mono ? 12 : 13 }}
    />
  </div>
);

// =========================================================
// COMPILER OPS — heavy actions
// =========================================================
const CompilerOpsCard = () => {
  const [job, setJob] = useState(null); // { name, progress, eta, current, total, log: [] }
  const startJob = (name, total) => {
    setJob({ name, progress: 0, current: 0, total, log: [] });
    let cur = 0;
    const t = setInterval(() => {
      cur += Math.ceil(Math.random() * 5 + 2);
      const pct = Math.min(100, (cur / total) * 100);
      const sample = [
        "consensus/raft.md", "db/lsm-tree.md", "messaging/kafka.md", "patterns/cqrs.md",
        "reliability/circuit-breakers.md", "caching/ttl-policies.md", "networking/tcp.md"
      ];
      setJob(j => j ? ({
        ...j, current: Math.min(total, cur), progress: pct,
        log: [{ page: sample[Math.floor(Math.random() * sample.length)], result: Math.random() > 0.1 ? "ok" : "warn" }, ...j.log].slice(0, 5),
      }) : null);
      if (pct >= 100) { clearInterval(t); setTimeout(() => setJob(null), 1800); }
    }, 180);
  };

  return (
    <Card
      title="Compiler operations"
      glyph={<I.Compile size={12} />}
      right={<span className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>{job ? "RUNNING" : "IDLE"}</span>}
    >
      <div className="section-sub" style={{ marginTop: 0, marginBottom: 12 }}>
        Bulk operations that run the LLM compiler over the entire vault. Long-running — runs in background, safe to navigate away.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <OpButton
          glyph={<I.Compile size={13} />}
          title="Re-compile entire vault"
          desc="Re-pass every note through the compiler. Surfaces stale facts, dead links, weak sections."
          cost="~22 min · 312 pages · $0.84"
          accent
          onClick={() => startJob("Re-compiling vault", 312)}
          busy={!!job}
        />
        <OpButton
          glyph={<I.Layers size={13} />}
          title="Re-embed everything"
          desc="Rebuild the retrieval index from scratch. Required after switching embedding model."
          cost="~6 min · 312 pages · $0.04"
          onClick={() => startJob("Re-embedding vault", 312)}
          busy={!!job}
        />
        <OpButton
          glyph={<I.Alert size={13} />}
          title="Full vault lint"
          desc="Broken wikilinks, orphans, duplicate concepts, area-mismatches, status auto-grade."
          cost="~90 sec · local"
          onClick={() => startJob("Linting vault", 312)}
          busy={!!job}
        />
        <OpButton
          glyph={<I.Graph size={13} />}
          title="Rebuild knowledge graph"
          desc="Re-compute backlinks, centrality scores, concept clusters, suggested merges."
          cost="~40 sec · local"
          onClick={() => startJob("Building graph", 312)}
          busy={!!job}
        />
      </div>

      {job && (
        <div style={{
          marginTop: 14, padding: "12px 14px",
          background: "var(--bg-card)", border: "1px solid var(--accent-line)", borderRadius: 6,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div>
              <div style={{ color: "var(--text-hi)", fontSize: 13, fontWeight: 500 }}>{job.name}</div>
              <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>
                {job.current} / {job.total} pages
              </div>
            </div>
            <div className="t-mono t-num" style={{ fontSize: 22, color: "var(--accent-hi)" }}>
              {Math.round(job.progress)}%
            </div>
          </div>
          <div className="pbar pbar--shimmer"><i style={{ width: `${job.progress}%` }} /></div>
          {job.log.length > 0 && (
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 3 }}>
              {job.log.map((l, i) => (
                <div key={i} className="t-mono" style={{ fontSize: 10, color: "var(--text-dim)", display: "flex", gap: 6, opacity: 1 - i * 0.18 }}>
                  <span style={{ color: l.result === "ok" ? "var(--neon-green)" : "var(--neon-amber)" }}>{l.result === "ok" ? "✓" : "⚠"}</span>
                  <span style={{ color: "var(--text-body)" }}>{l.page}</span>
                </div>
              ))}
            </div>
          )}
          <button className="btn btn--ghost btn--sm" style={{ marginTop: 10 }}>
            <I.X size={10} /> Cancel
          </button>
        </div>
      )}
    </Card>
  );
};

const OpButton = ({ glyph, title, desc, cost, onClick, accent, busy }) => (
  <button onClick={onClick} disabled={busy} style={{
    display: "grid", gridTemplateColumns: "auto 1fr", gap: 10, alignItems: "flex-start",
    padding: "12px 14px",
    background: accent ? "var(--accent-soft)" : "var(--bg-card)",
    border: `1px solid ${accent ? "var(--accent-line)" : "var(--border)"}`,
    borderRadius: 8,
    textAlign: "left",
    color: "var(--text)",
    cursor: busy ? "not-allowed" : "pointer",
    opacity: busy ? 0.5 : 1,
    transition: "border-color 120ms, background 120ms",
  }}>
    <span style={{ color: accent ? "var(--accent-hi)" : "var(--text)", display: "inline-flex", marginTop: 2 }}>{glyph}</span>
    <div>
      <div style={{ color: "var(--text-hi)", fontSize: 13, fontWeight: 600, letterSpacing: "-0.005em" }}>{title}</div>
      <div className="section-sub" style={{ margin: "4px 0 6px" }}>{desc}</div>
      <div className="t-mono" style={{ fontSize: 10, color: accent ? "var(--accent-hi)" : "var(--text-faint)" }}>{cost}</div>
    </div>
  </button>
);

// =========================================================
// COMPILER DEFAULTS (knobs)
// =========================================================
const KnobsCard = () => {
  const [temp, setTemp] = useState(0.4);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [promoteConf, setPromoteConf] = useState(0.78);
  const [tokenBudget, setTokenBudget] = useState(120);

  return (
    <Card title="Compiler defaults" glyph={<I.Bolt size={12} />}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, marginBottom: 16 }}>
        <SliderRow label="TEMPERATURE"       value={temp}        onChange={setTemp}       min={0}   max={1}    step={0.05} fmt={v => v.toFixed(2)} />
        <SliderRow label="MAX TOKENS / RESPONSE" value={maxTokens} onChange={setMaxTokens} min={256} max={8192} step={128}  fmt={v => v.toLocaleString()} />
        <SliderRow label="MIN PROMOTE CONFIDENCE" value={promoteConf} onChange={setPromoteConf} min={0.5} max={0.99} step={0.01} fmt={v => v.toFixed(2)} accent />
        <SliderRow label="SESSION TOKEN BUDGET (K)" value={tokenBudget} onChange={setTokenBudget} min={20}  max={500} step={10} fmt={v => `${v}k`} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Toggle label="Auto-promote at confidence ≥ 0.92" defaultOn={false} />
        <Toggle label="Always show vault gaps"            defaultOn />
        <Toggle label="Include reasoning trace in answer" defaultOn={false} />
        <Toggle label="Strict citation mode"              defaultOn />
      </div>
    </Card>
  );
};

const SliderRow = ({ label, value, onChange, min, max, step, fmt, accent }) => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
      <span className="t-label">{label}</span>
      <span className="t-mono t-num" style={{ fontSize: 13, color: accent ? "var(--accent-hi)" : "var(--text-hi)" }}>{fmt(value)}</span>
    </div>
    <input type="range" className="slider" min={min} max={max} step={step}
      value={value} onChange={(e) => onChange(parseFloat(e.target.value))} />
    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
      <span className="t-mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>{fmt(min)}</span>
      <span className="t-mono" style={{ fontSize: 9, color: "var(--text-faint)" }}>{fmt(max)}</span>
    </div>
  </div>
);

// =========================================================
// KEYBOARD & UI
// =========================================================
const KeyboardCard = () => {
  const binds = [
    { action: "Open command palette",    keys: ["⌘", "K"] },
    { action: "Promote last answer",     keys: ["⌘", "↑"] },
    { action: "Compile session",         keys: ["⌘", "⇧", "C"] },
    { action: "Toggle side panels",      keys: ["⌘", "\\"] },
    { action: "Jump to dashboard",       keys: ["⌘", "1"] },
    { action: "Jump to study",           keys: ["⌘", "2"] },
    { action: "Jump to graph",           keys: ["⌘", "G"] },
    { action: "Start flashcards",        keys: ["⌘", "R"] },
  ];
  return (
    <Card title="Keyboard & UI" glyph={<I.Command size={12} />}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
        {binds.map(b => (
          <div key={b.action} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "7px 10px", borderRadius: 4,
          }}>
            <span style={{ color: "var(--text-body)", fontSize: 12 }}>{b.action}</span>
            <span style={{ display: "flex", gap: 3 }}>
              {b.keys.map(k => <span key={k} className="kbd kbd--inline">{k}</span>)}
            </span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px dashed var(--border)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Toggle label="Compact density"    defaultOn={false} />
        <Toggle label="Show source scores" defaultOn />
        <Toggle label="Animations"         defaultOn />
        <Toggle label="Sound effects"      defaultOn={false} />
      </div>
    </Card>
  );
};

// =========================================================
// DANGER ZONE
// =========================================================
const DangerCard = () => (
  <Card title="Danger zone" glyph={<I.Alert size={12} />}>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <DangerRow
        title="Clear retrieval cache"
        desc="Forces fresh embeddings on next query. Safe — only flushes 412 MB of cached vector lookups."
        btn="Clear cache" tone="warn"
      />
      <DangerRow
        title="Reset all sessions"
        desc="Wipes session history, scratchpad context, and the streak counter. Vault notes untouched."
        btn="Reset sessions" tone="warn"
      />
      <DangerRow
        title="Wipe vault index"
        desc="Deletes the local search/embed index. Vault files are kept; rebuild required before next query."
        btn="Wipe index" tone="danger"
      />
    </div>
  </Card>
);

const DangerRow = ({ title, desc, btn, tone }) => (
  <div style={{
    display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center",
    padding: "10px 12px",
    background: tone === "danger" ? "rgba(255,94,106,0.03)" : "var(--bg-card)",
    border: `1px solid ${tone === "danger" ? "rgba(255,94,106,0.18)" : "var(--border)"}`,
    borderRadius: 6,
  }}>
    <div>
      <div style={{ color: "var(--text-hi)", fontSize: 13, fontWeight: 500 }}>{title}</div>
      <div className="section-sub" style={{ marginTop: 2 }}>{desc}</div>
    </div>
    <button className={`btn btn--sm ${tone === "danger" ? "btn--danger" : ""}`}>{btn}</button>
  </div>
);

// =========================================================
// PROFILE ROOT
// =========================================================
const Profile = () => {
  return (
    <div style={{
      height: "100%", overflow: "auto", padding: "18px 28px 60px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 22 }}>
          <div>
            <div className="t-label" style={{ marginBottom: 4 }}>PROFILE · OPERATOR · LOCAL VAULT</div>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.015em" }}>
              Control panel
            </h1>
            <div className="t-mono" style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>
              ~/.sda/config.toml  ·  3 backends healthy  ·  vault clean
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--sm">
              <I.File size={11} /> Export config
            </button>
            <button className="btn btn--sm">
              <I.Ingest size={11} /> Import config
            </button>
            <button className="btn btn--primary btn--sm">
              <I.Check size={11} /> Saved
            </button>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Section numbered headers — render inline above each card */}
          <SectionHeader num="01" title="LLM Backends" sub="API keys, enable/disable each model, run a health probe." />
          <BackendsCard />

          <SectionHeader num="02" title="Routing" sub="How queries flow through the chain when a backend is down or rate-limited." />
          <RoutingCard />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <SectionHeader num="03" title="Vault & sync" sub="Where your knowledge lives and how it's backed up." />
              <VaultSyncCard />
            </div>
            <div>
              <SectionHeader num="04" title="Compiler defaults" sub="The knobs the compiler uses for every query." />
              <KnobsCard />
            </div>
          </div>

          <SectionHeader num="05" title="Compiler operations" sub="Bulk passes over the whole vault." />
          <CompilerOpsCard />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div>
              <SectionHeader num="06" title="Keyboard & UI" sub="Shortcuts and interface preferences." />
              <KeyboardCard />
            </div>
            <div>
              <SectionHeader num="07" title="Danger zone" sub="Destructive operations. Twice-confirmed." />
              <DangerCard />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const SectionHeader = ({ num, title, sub }) => (
  <div style={{ marginTop: 6 }}>
    <div className="section-title">
      <span className="num">{num}</span>
      {title}
    </div>
    <div className="section-sub">{sub}</div>
  </div>
);

Object.assign(window, { Profile });
