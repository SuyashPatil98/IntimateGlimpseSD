/* global React, ReactDOM, I,
   MOCK_HEALTH, MOCK_VAULT_STATS, MOCK_PROMOTE_PROPOSAL,
   Dashboard, Study, PromoteModal */

const { useState, useEffect } = React;

// =========================================================
// TOP BAR
// =========================================================
const TopBar = ({ view, onView, onOpenCmd, vaultStats, health }) => {
  return (
    <div className="topbar">
      <div className="brand">
        <div className="brand-mark">SDA</div>
        <span>SystemDesignAI</span>
        <span className="brand-sub">v0.4 · local</span>
      </div>

      <div className="tabs" role="tablist">
        <TabBtn glyph={<I.Home size={12} />}   label="Dashboard"        on={view === "dashboard"}  onClick={() => onView("dashboard")} />
        <TabBtn glyph={<I.Study size={12} />}  label="Study"            on={view === "study"}      onClick={() => onView("study")} />
        <TabBtn glyph={<I.Vault size={12} />}  label="Vault"            on={view === "vault"}      onClick={() => onView("vault")} />
        <TabBtn glyph={<I.Graph size={12} />}  label="Graph"            on={view === "graph"}      onClick={() => onView("graph")} />
        <TabBtn glyph={<I.Cards size={12} />}  label="Flashcards"       on={view === "flashcards"} onClick={() => onView("flashcards")} />
        <TabBtn glyph={<I.Map size={12} />}    label="Roadmap"          on={view === "roadmap"}    onClick={() => onView("roadmap")} />
        <TabBtn glyph={<I.Ingest size={12} />} label="Ingest"           on={view === "ingest"}     onClick={() => onView("ingest")} />
        <TabBtn glyph={<I.Command size={12} />} label="Profile"         on={view === "profile"}    onClick={() => onView("profile")} />
      </div>

      <div className="topbar-meta">
        <div className="meta-pill" title="Vault size">
          <span className="lbl">NOTES</span>
          <b>{vaultStats.total}</b>
          <span className="t-faint">·</span>
          <span style={{ color: "var(--accent-hi)" }}>+{vaultStats.promotedToday} today</span>
        </div>

        <BackendStatusPill health={health} />

        <button className="cmdk" onClick={onOpenCmd}>
          <I.Search size={11} />
          <span>Search vault</span>
          <span className="kbd kbd--inline" style={{ marginLeft: 4 }}>⌘ K</span>
        </button>
      </div>
    </div>
  );
};

const TabBtn = ({ glyph, label, on, onClick }) => (
  <button className={`tab ${on ? "is-active" : ""}`} onClick={onClick}>
    <span className="tab-glyph">{glyph}</span>{label}
  </button>
);

const BackendStatusPill = ({ health }) => {
  const { qwen, claude, gemini } = health.backends;
  const primaryOk = qwen;
  const fallbackOk = claude;
  const tone =
    primaryOk ? "ok" :
    fallbackOk ? "fb" :
    "dn";
  return (
    <div className="backend-pill" title="Backend routing">
      <span className={`dot ${tone}`} />
      <span className="b">QWEN</span>
      <span className="seg">{qwen ? "✓" : "·"}</span>
      <span className="sep">/</span>
      <span className="b">CLAUDE</span>
      <span className="seg">{claude ? "✓" : "·"}</span>
      <span className="sep">/</span>
      <span className="seg" style={{ color: gemini ? "var(--text-hi)" : "var(--text-faint)" }}>GEMINI</span>
      <span className="seg" style={{ color: gemini ? "var(--text-hi)" : "var(--text-faint)" }}>{gemini ? "✓" : "✗"}</span>
    </div>
  );
};

// =========================================================
// COMMAND PALETTE (lightweight mock)
// =========================================================
const CommandPalette = ({ onClose }) => {
  const [q, setQ] = useState("");
  const items = [
    { glyph: <I.Promote size={13} />, label: "Promote last answer to vault",    kbd: "⌘ ↑",    cat: "Study" },
    { glyph: <I.Compile size={13} />, label: "Compile this session",            kbd: "⌘ ⇧ C",  cat: "Study" },
    { glyph: <I.Plus    size={13} />, label: "New note in current area…",       kbd: "⌘ N",    cat: "Vault" },
    { glyph: <I.Cards   size={13} />, label: "Start flashcard review (12 due)", kbd: "⌘ R",    cat: "Flashcards" },
    { glyph: <I.Graph   size={13} />, label: "Open knowledge graph",            kbd: "⌘ G",    cat: "Navigate" },
    { glyph: <I.Layers  size={13} />, label: "Switch primary backend → Claude", kbd: "",       cat: "System" },
  ];
  const filtered = q ? items.filter(i => i.label.toLowerCase().includes(q.toLowerCase())) : items;

  useEffect(() => {
    const h = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(620px, 90vw)", maxHeight: "60vh" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border)" }}>
          <I.Search size={14} stroke="var(--text-dim)" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Search notes, run commands, jump to area…"
            style={{ flex: 1, background: "transparent", border: "none", outline: "none", color: "var(--text-hi)", fontSize: 14, fontFamily: "var(--font-body)" }} />
          <span className="kbd kbd--inline">ESC</span>
        </div>
        <div style={{ overflow: "auto", padding: 6 }}>
          {filtered.map((it, i) => (
            <button key={i} style={{
              display: "grid", gridTemplateColumns: "auto 1fr auto auto", gap: 12, alignItems: "center",
              width: "100%", padding: "10px 12px", borderRadius: 6, textAlign: "left",
              background: i === 0 ? "rgba(139,125,255,0.06)" : "transparent",
              borderLeft: i === 0 ? "2px solid var(--accent)" : "2px solid transparent",
              color: "var(--text)",
            }}>
              <span style={{ color: "var(--accent-hi)", display: "inline-flex" }}>{it.glyph}</span>
              <span style={{ fontSize: 13 }}>{it.label}</span>
              <span className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.06em" }}>{it.cat.toUpperCase()}</span>
              {it.kbd && <span className="kbd kbd--inline">{it.kbd}</span>}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// =========================================================
// APP ROOT
// =========================================================
const App = () => {
  const [view, setView] = useState("dashboard");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [health, setHealth] = useState(MOCK_HEALTH);
  const [vaultStats, setVaultStats] = useState(MOCK_VAULT_STATS);

  // Live backend health + vault size (top bar), polled every 12s.
  useEffect(() => {
    const load = () => {
      fetch("/api/health").then((r) => (r.ok ? r.json() : null)).then((d) => {
        if (d) { setHealth(d); setVaultStats((v) => ({ ...v, total: d.vault.pages })); }
      }).catch(() => {});
    };
    load();
    const id = setInterval(load, 12000);
    return () => clearInterval(id);
  }, []);

  const onStart = (kind) => {
    if (kind === "resume" || kind === "focus" || kind === "new") setView("study");
    if (kind === "cards") setView("flashcards");
  };

  // Keyboard shortcuts
  useEffect(() => {
    const h = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault(); setCmdOpen((o) => !o);
      }
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault(); setView("study");
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowUp") {
        e.preventDefault(); setView("study");
      }
      // Quick-jump shortcuts
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey) {
        const map = { "1": "dashboard", "2": "study", "3": "vault", "4": "graph", "5": "flashcards", "6": "roadmap", "7": "ingest", "8": "profile" };
        if (map[e.key]) { e.preventDefault(); setView(map[e.key]); }
        if (e.key.toLowerCase() === "g") { e.preventDefault(); setView("graph"); }
        if (e.key.toLowerCase() === "r") { e.preventDefault(); setView("flashcards"); }
      }
    };
    window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h);
  }, []);

  return (
    <>
      <div className="app-bg" />
      <div className="shell">
        <TopBar
          view={view}
          onView={setView}
          onOpenCmd={() => setCmdOpen(true)}
          vaultStats={vaultStats}
          health={health}
        />
        <div style={{ minHeight: 0, position: "relative" }}>
          {view === "dashboard"  && <Dashboard onStart={onStart} />}
          {view === "study"      && <Study />}
          {view === "vault"      && <Vault />}
          {view === "graph"      && <Graph />}
          {view === "flashcards" && <Flashcards />}
          {view === "roadmap"    && <Roadmap />}
          {view === "ingest"     && <Ingest />}
          {view === "profile"    && <Profile />}
        </div>
      </div>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
    </>
  );
};

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
