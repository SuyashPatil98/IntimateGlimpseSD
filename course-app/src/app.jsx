/* global React, ReactDOM, I,
   MOCK_HEALTH, MOCK_VAULT_STATS, MOCK_PROMOTE_PROPOSAL,
   Dashboard, Study, PromoteModal */

const { useState, useEffect } = React;

// =========================================================
// TOP BAR
// =========================================================
const TopBar = ({ view, onView, onOpenCmd, vaultStats, health, apiUp }) => {
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

        <BackendStatusPill health={health} apiUp={apiUp} />

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

const BackendStatusPill = ({ health, apiUp }) => {
  const b = (health && health.backends) || {};
  const down = apiUp === false;
  const tone = apiUp === null ? "fb" : down ? "dn" : (b.qwen || b.claude) ? "ok" : "dn";
  const Seg = ({ label, ok }) => (
    <>
      <span className="b" style={{ color: ok ? "var(--text-hi)" : "var(--text-faint)" }}>{label}</span>
      <span className="seg" style={{ color: ok ? "var(--neon-green)" : "var(--text-faint)" }}>{ok ? "✓" : "✗"}</span>
    </>
  );
  return (
    <div className="backend-pill" title={down ? "Backend API unreachable on :8000 — start it (see README / run.ps1)" : "API :8000 reachable · QWEN local · CLAUDE fallback"}>
      <span className={`dot ${tone}`} />
      {apiUp === null ? (
        <span className="b" style={{ color: "var(--text-faint)" }}>CHECKING…</span>
      ) : down ? (
        <span className="b" style={{ color: "var(--neon-red)" }}>API DOWN · start backend</span>
      ) : (
        <>
          <Seg label="API" ok />
          <span className="sep">/</span>
          <Seg label="QWEN" ok={!!b.qwen} />
          <span className="sep">/</span>
          <Seg label="CLAUDE" ok={!!b.claude} />
          <span className="sep">/</span>
          <Seg label="GEMINI" ok={!!b.gemini} />
        </>
      )}
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
// Keep-alive wrapper: stays in the DOM when hidden so screen state survives nav.
const Screen = ({ show, children }) => (
  <div style={{ height: "100%", display: show ? "block" : "none" }}>{children}</div>
);

const App = () => {
  const [view, setView] = useState("dashboard");
  const [cmdOpen, setCmdOpen] = useState(false);
  const [health, setHealth] = useState(MOCK_HEALTH);
  const [vaultStats, setVaultStats] = useState(MOCK_VAULT_STATS);
  const [mounted, setMounted] = useState({ dashboard: true });
  const [apiUp, setApiUp] = useState(null); // null = checking, true/false = reachable
  const [, setTick] = useState(0);

  // Keep-alive: once a screen is visited it stays mounted (hidden via CSS) so
  // navigating away and back preserves its state — e.g. the Study conversation.
  useEffect(() => { setMounted((m) => (m[view] ? m : { ...m, [view]: true })); }, [view]);

  // Live backend data, polled. Dashboard reads MOCK_* globals, so we overwrite
  // them with live data and bump a tick to re-render (no edits to dashboard.jsx).
  useEffect(() => {
    const j = (p) => fetch(p).then((r) => (r.ok ? r.json() : null)).catch(() => null);
    const load = async () => {
      const [h, stats, cov, recent] = await Promise.all([
        j("/api/health"), j("/api/vault/stats"),
        j("/api/areas/coverage"), j("/api/vault/recent-promoted?n=5"),
      ]);
      if (h) { setHealth(h); setApiUp(true); } else { setApiUp(false); }
      if (stats) { window.MOCK_VAULT_STATS = { ...window.MOCK_VAULT_STATS, ...stats }; setVaultStats(window.MOCK_VAULT_STATS); }
      if (cov && cov.length) window.MOCK_AREA_COVERAGE = cov;
      if (Array.isArray(recent) && recent.length) window.MOCK_RECENT_PROMOTED = recent;
      setTick((t) => t + 1);
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
          apiUp={apiUp}
        />
        <div style={{ minHeight: 0, position: "relative" }}>
          <Screen show={view === "dashboard"}>{mounted.dashboard  && <Dashboard onStart={onStart} />}</Screen>
          <Screen show={view === "study"}>{mounted.study          && <Study />}</Screen>
          <Screen show={view === "vault"}>{mounted.vault          && <Vault />}</Screen>
          <Screen show={view === "graph"}>{mounted.graph          && <Graph />}</Screen>
          <Screen show={view === "flashcards"}>{mounted.flashcards && <Flashcards />}</Screen>
          <Screen show={view === "roadmap"}>{mounted.roadmap      && <Roadmap />}</Screen>
          <Screen show={view === "ingest"}>{mounted.ingest        && <Ingest />}</Screen>
          <Screen show={view === "profile"}>{mounted.profile      && <Profile />}</Screen>
        </div>
      </div>

      {cmdOpen && <CommandPalette onClose={() => setCmdOpen(false)} />}
    </>
  );
};

// HMR-safe mount: reuse the root across hot reloads.
if (!window.__sdaRoot) window.__sdaRoot = ReactDOM.createRoot(document.getElementById("root"));
window.__sdaRoot.render(<App />);
