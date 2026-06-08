/* global React, I, AREAS, AREA_ORDER, StatusBadge, AreaDot, Card */

const { useState, useEffect, useMemo, useRef } = React;

// =========================================================
// MOCK GRAPH — 36 nodes across 14 areas with realistic edges
// =========================================================
const GRAPH_NODES = [
  // distributed-systems
  { id: "n1",  title: "Raft",                       area: "distributed-systems",     status: "comprehensive", inbound: 14 },
  { id: "n2",  title: "Paxos",                      area: "distributed-systems",     status: "mature",        inbound: 9  },
  { id: "n3",  title: "Vector Clocks",              area: "distributed-systems",     status: "mature",        inbound: 7  },
  { id: "n4",  title: "Two-Phase Commit",           area: "distributed-systems",     status: "draft",         inbound: 5  },
  { id: "n5",  title: "Quorum Reads/Writes",        area: "distributed-systems",     status: "mature",        inbound: 8  },
  // databases
  { id: "n6",  title: "LSM Tree",                   area: "databases",               status: "mature",        inbound: 11 },
  { id: "n7",  title: "B-Tree",                     area: "databases",               status: "mature",        inbound: 9  },
  { id: "n8",  title: "WAL & Replication",          area: "databases",               status: "comprehensive", inbound: 12 },
  { id: "n9",  title: "MVCC",                       area: "databases",               status: "draft",         inbound: 4  },
  // networking
  { id: "n10", title: "TCP Congestion",             area: "networking",              status: "mature",        inbound: 6  },
  { id: "n11", title: "QUIC",                       area: "networking",              status: "draft",         inbound: 3  },
  // storage
  { id: "n12", title: "Object Storage",             area: "storage",                 status: "mature",        inbound: 5  },
  { id: "n13", title: "Block vs File",              area: "storage",                 status: "stub",          inbound: 2  },
  // messaging
  { id: "n14", title: "Kafka Exactly-Once",         area: "messaging",               status: "mature",        inbound: 10 },
  { id: "n15", title: "Idempotent Producers",       area: "messaging",               status: "mature",        inbound: 7  },
  { id: "n16", title: "Transaction Coordinator",    area: "messaging",               status: "draft",         inbound: 4  },
  // caching
  { id: "n17", title: "Cache Aside",                area: "caching",                 status: "mature",        inbound: 8  },
  { id: "n18", title: "TTL Policies",               area: "caching",                 status: "draft",         inbound: 5  },
  // reliability
  { id: "n19", title: "Circuit Breakers",           area: "reliability",             status: "draft",         inbound: 6  },
  { id: "n20", title: "Bulkheads",                  area: "reliability",             status: "stub",          inbound: 2  },
  { id: "n21", title: "Backpressure",               area: "reliability",             status: "mature",        inbound: 7  },
  // architecture-patterns
  { id: "n22", title: "CQRS + Event Sourcing",      area: "architecture-patterns",   status: "draft",         inbound: 8  },
  { id: "n23", title: "Saga",                       area: "architecture-patterns",   status: "mature",        inbound: 6  },
  { id: "n24", title: "Hexagonal Architecture",     area: "architecture-patterns",   status: "mature",        inbound: 5  },
  // design-patterns
  { id: "n25", title: "Idempotency Keys",           area: "design-patterns",         status: "comprehensive", inbound: 13 },
  { id: "n26", title: "Outbox Pattern",             area: "design-patterns",         status: "mature",        inbound: 9  },
  // software-engineering
  { id: "n27", title: "Testing Pyramid",            area: "software-engineering",    status: "draft",         inbound: 3  },
  // data-engineering
  { id: "n28", title: "Lambda Architecture",        area: "data-engineering",        status: "stub",          inbound: 2  },
  { id: "n29", title: "Medallion Bronze/Silver",    area: "data-engineering",        status: "stub",          inbound: 1  },
  // ml-systems
  { id: "n30", title: "Feature Stores",             area: "ml-systems",              status: "stub",          inbound: 2  },
  { id: "n31", title: "Online vs Offline",          area: "ml-systems",              status: "stub",          inbound: 1  },
  // system-design-interview
  { id: "n32", title: "Tinder Architecture",        area: "system-design-interview", status: "draft",         inbound: 4  },
  { id: "n33", title: "URL Shortener",              area: "system-design-interview", status: "mature",        inbound: 6  },
  // case-studies
  { id: "n34", title: "Discord Voice Architecture", area: "case-studies",            status: "draft",         inbound: 3  },
  { id: "n35", title: "Figma OT/CRDT",              area: "case-studies",            status: "draft",         inbound: 4  },
  { id: "n36", title: "Orphan: Probabilistic DS",   area: "design-patterns",         status: "stub",          inbound: 0  },
];

const GRAPH_EDGES = [
  ["n1","n2"], ["n1","n5"], ["n2","n3"], ["n2","n4"], ["n5","n3"], ["n4","n8"],
  ["n6","n7"], ["n6","n8"], ["n7","n8"], ["n8","n9"], ["n8","n5"],
  ["n14","n15"], ["n14","n16"], ["n15","n25"], ["n14","n25"], ["n16","n25"],
  ["n17","n18"], ["n17","n6"], ["n18","n21"],
  ["n19","n21"], ["n19","n20"], ["n21","n10"],
  ["n22","n23"], ["n22","n26"], ["n23","n26"], ["n24","n22"], ["n23","n8"],
  ["n25","n26"], ["n25","n19"], ["n25","n14"],
  ["n27","n24"],
  ["n28","n29"], ["n28","n6"], ["n30","n31"], ["n30","n6"],
  ["n32","n14"], ["n32","n17"], ["n33","n8"], ["n33","n11"], ["n34","n10"], ["n34","n11"], ["n35","n3"], ["n35","n22"],
  ["n10","n11"], ["n12","n8"], ["n13","n12"],
];

// =========================================================
// Force layout (compute once, deterministic)
// =========================================================
const useGraphLayout = (nodes, edges, w, h) => {
  return useMemo(() => {
    const N = nodes.length;
    // seed positions: each area has a target cluster center on a circle
    const areaIdx = {};
    AREA_ORDER.forEach((a, i) => { areaIdx[a] = i; });
    const cx = w / 2, cy = h / 2;
    const R  = Math.min(w, h) * 0.30;

    const pos = nodes.map((n, i) => {
      const a = areaIdx[n.area] ?? i;
      const ang = (a / AREA_ORDER.length) * Math.PI * 2 - Math.PI / 2;
      // deterministic jitter per node id (hash so any string id works)
      let seed = 0; for (let k = 0; k < n.id.length; k++) seed = (seed * 31 + n.id.charCodeAt(k)) >>> 0;
      const jx = ((seed * 31) % 100 - 50) / 50;
      const jy = ((seed * 53) % 100 - 50) / 50;
      return {
        id: n.id, area: n.area,
        x: cx + Math.cos(ang) * R + jx * 60,
        y: cy + Math.sin(ang) * R + jy * 60,
        vx: 0, vy: 0,
      };
    });

    // adjacency
    const adj = new Map(nodes.map(n => [n.id, []]));
    edges.forEach(([a, b]) => { adj.get(a).push(b); adj.get(b).push(a); });

    // simulation ticks
    for (let tick = 0; tick < 220; tick++) {
      const cool = 1 - tick / 220;
      // repulsion (Coulomb-ish, O(N^2) — fine for 36 nodes)
      for (let i = 0; i < N; i++) {
        for (let j = i + 1; j < N; j++) {
          const dx = pos[j].x - pos[i].x;
          const dy = pos[j].y - pos[i].y;
          const d2 = dx * dx + dy * dy + 0.01;
          const d  = Math.sqrt(d2);
          const f  = 2200 / d2;
          const fx = (dx / d) * f, fy = (dy / d) * f;
          pos[i].vx -= fx; pos[i].vy -= fy;
          pos[j].vx += fx; pos[j].vy += fy;
        }
      }
      // attraction along edges
      edges.forEach(([a, b]) => {
        const A = pos.find(p => p.id === a), B = pos.find(p => p.id === b);
        const dx = B.x - A.x, dy = B.y - A.y;
        const d = Math.sqrt(dx*dx + dy*dy) + 0.01;
        const target = 80;
        const f = (d - target) * 0.04;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        A.vx += fx; A.vy += fy;
        B.vx -= fx; B.vy -= fy;
      });
      // gentle pull toward area cluster (keeps colors coherent)
      pos.forEach((p) => {
        const a = areaIdx[p.area] ?? 0;
        const ang = (a / AREA_ORDER.length) * Math.PI * 2 - Math.PI / 2;
        const tx = cx + Math.cos(ang) * R;
        const ty = cy + Math.sin(ang) * R;
        p.vx += (tx - p.x) * 0.008;
        p.vy += (ty - p.y) * 0.008;
      });
      // integrate + damp
      pos.forEach(p => {
        p.vx *= 0.85 * cool;
        p.vy *= 0.85 * cool;
        p.x  += p.vx;
        p.y  += p.vy;
        // bound
        p.x = Math.max(40, Math.min(w - 40, p.x));
        p.y = Math.max(40, Math.min(h - 40, p.y));
      });
    }

    const byId = new Map(pos.map(p => [p.id, p]));
    return { byId, adj };
  }, [nodes, edges, w, h]);
};

// =========================================================
// Knowledge Graph view
// =========================================================
const Graph = () => {
  const containerRef = useRef(null);
  const [dim, setDim] = useState({ w: 1000, h: 700 });
  const [hover, setHover] = useState(null);
  const [selected, setSelected] = useState(null);
  const [orphansOnly, setOrphansOnly] = useState(false);
  const [activeArea, setActiveArea] = useState(null); // single-area filter

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setDim({ w: Math.max(600, r.width), h: Math.max(400, r.height) });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const [data, setData] = useState({ nodes: GRAPH_NODES, edges: GRAPH_EDGES });
  useEffect(() => {
    fetch("/api/graph").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (!d || !d.nodes || !d.nodes.length) return;
      // Cap to the most-connected nodes so the client force-layout stays smooth.
      const top = [...d.nodes].sort((a, b) => (b.inbound || 0) - (a.inbound || 0)).slice(0, 120);
      const ids = new Set(top.map((n) => n.id));
      setData({ nodes: top, edges: d.edges.filter(([a, b]) => ids.has(a) && ids.has(b)) });
    }).catch(() => {});
  }, []);
  const nodes = data.nodes;
  const edges = data.edges;
  const { byId, adj } = useGraphLayout(nodes, edges, dim.w, dim.h);

  const visible = (n) => {
    if (orphansOnly && (adj.get(n.id)?.length || 0) > 0) return false;
    if (activeArea && n.area !== activeArea) return false;
    return true;
  };

  const focusId = hover || selected;
  const focusedNeighbors = focusId ? new Set(adj.get(focusId) || []) : null;

  const nodeRadius = (n) => 6 + Math.min(14, Math.sqrt(n.inbound) * 2.6);

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      {/* Left side: filters */}
      <div style={{
        width: 200, padding: "12px 12px",
        borderRight: "1px solid var(--border)",
        background: "rgba(15,19,34,0.4)",
        display: "flex", flexDirection: "column", gap: 12, minHeight: 0,
      }}>
        <div className="card__title"><I.Graph size={11} /><span>Filters</span></div>

        <div>
          <div className="t-label" style={{ marginBottom: 8 }}>AREAS · {AREA_ORDER.length}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3, maxHeight: 280, overflow: "auto" }}>
            <button onClick={() => setActiveArea(null)} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "5px 8px", borderRadius: 4, textAlign: "left",
              color: !activeArea ? "var(--text-hi)" : "var(--text-dim)",
              background: !activeArea ? "rgba(139,125,255,0.06)" : "transparent",
              borderLeft: !activeArea ? "2px solid var(--accent)" : "2px solid transparent",
              fontSize: 11.5,
            }}>
              <span>All areas</span>
              <span className="t-mono t-faint" style={{ fontSize: 10 }}>{nodes.length}</span>
            </button>
            {AREA_ORDER.map(a => {
              const count = nodes.filter(n => n.area === a).length;
              return (
                <button key={a} onClick={() => setActiveArea(a === activeArea ? null : a)} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                  padding: "5px 8px", borderRadius: 4, textAlign: "left",
                  color: activeArea === a ? "var(--text-hi)" : "var(--text-dim)",
                  background: activeArea === a ? "rgba(139,125,255,0.06)" : "transparent",
                  borderLeft: activeArea === a ? `2px solid ${AREAS[a].color}` : "2px solid transparent",
                  fontSize: 11.5,
                }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                    <AreaDot area={a} size={6} />
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{AREAS[a].label}</span>
                  </span>
                  <span className="t-mono t-faint" style={{ fontSize: 10 }}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
          <button onClick={() => setOrphansOnly(o => !o)} style={{
            width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "8px 10px", borderRadius: 6,
            background: orphansOnly ? "rgba(255,177,61,0.08)" : "var(--bg-card)",
            border: `1px solid ${orphansOnly ? "rgba(255,177,61,0.35)" : "var(--border)"}`,
            color: "var(--text)", fontSize: 12,
          }}>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <I.Alert size={11} stroke={orphansOnly ? "var(--neon-amber)" : "var(--text-dim)"} />
              Orphans only
            </span>
            <div className={`toggle ${orphansOnly ? "on" : ""}`} />
          </button>
          <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 6, padding: "0 4px" }}>
            Notes with zero inbound or outbound links. {nodes.filter(n => (adj.get(n.id)?.length || 0) === 0).length} found.
          </div>
        </div>

        <div style={{ paddingTop: 10, borderTop: "1px dashed var(--border)" }}>
          <div className="t-label" style={{ marginBottom: 8 }}>LEGEND</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, fontSize: 11, color: "var(--text-dim)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18"><circle cx="9" cy="9" r="3" fill="var(--accent)" /></svg>
              <span>Size = inbound links</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18"><circle cx="9" cy="9" r="6" fill="none" stroke="var(--accent)" strokeWidth="2"/></svg>
              <span>Ring = comprehensive</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="18" height="18"><circle cx="9" cy="9" r="6" fill="none" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 2"/></svg>
              <span>Dashed = draft / stub</span>
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div ref={containerRef} style={{ flex: 1, position: "relative", minWidth: 0, minHeight: 0, overflow: "hidden" }}>
        <svg width={dim.w} height={dim.h} style={{ position: "absolute", inset: 0 }}>
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%"  stopColor="rgba(139,125,255,0.05)" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bgGlow)" />

          {/* edges */}
          {edges.map(([a, b], i) => {
            const A = byId.get(a), B = byId.get(b);
            if (!A || !B) return null;
            const nA = nodes.find(n => n.id === a);
            const nB = nodes.find(n => n.id === b);
            if (orphansOnly && (adj.get(a)?.length || 0) > 0 && (adj.get(b)?.length || 0) > 0) return null;
            if (activeArea && nA.area !== activeArea && nB.area !== activeArea) return null;
            const isFocus = focusId && (focusId === a || focusId === b);
            return (
              <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
                stroke={isFocus ? "var(--accent)" : "rgba(148,158,200,0.10)"}
                strokeWidth={isFocus ? 1.5 : 0.8}
                style={{ transition: "stroke 150ms" }}
              />
            );
          })}

          {/* nodes */}
          {nodes.map(n => {
            const p = byId.get(n.id);
            if (!p || !visible(n)) return null;
            const r = nodeRadius(n);
            const isHover  = hover === n.id;
            const isSelect = selected === n.id;
            const isNeighbor = focusedNeighbors && focusedNeighbors.has(n.id);
            const dim = focusId && !isHover && !isSelect && !isNeighbor;
            const color = AREAS[n.area].color;
            const stroke =
              n.status === "comprehensive" ? color :
              n.status === "mature"        ? color :
              n.status === "draft"         ? "rgba(148,158,200,0.6)" :
                                             "rgba(148,158,200,0.3)";
            const sw = n.status === "comprehensive" ? 2.5 : n.status === "mature" ? 1.5 : 1;
            const dash = n.status === "draft" ? "3 2" : n.status === "stub" ? "1 2" : null;

            return (
              <g key={n.id}
                onMouseEnter={() => setHover(n.id)}
                onMouseLeave={() => setHover(null)}
                onClick={() => setSelected(s => s === n.id ? null : n.id)}
                style={{ cursor: "pointer", opacity: dim ? 0.22 : 1, transition: "opacity 150ms" }}
              >
                <circle cx={p.x} cy={p.y} r={r + 6} fill={color} opacity={(isHover || isSelect) ? 0.18 : 0} style={{ transition: "opacity 150ms" }} />
                <circle
                  cx={p.x} cy={p.y} r={r}
                  fill={n.status === "stub" ? "var(--bg-card)" : color}
                  stroke={stroke} strokeWidth={sw}
                  strokeDasharray={dash}
                  style={{ filter: (isHover || isSelect) ? `drop-shadow(0 0 8px ${color})` : "none", transition: "filter 150ms" }}
                />
                {(isHover || isSelect || (n.inbound >= 10)) && (
                  <text x={p.x} y={p.y + r + 14}
                    fill="var(--text-hi)" fontSize="11" fontFamily="var(--font-mono)"
                    textAnchor="middle" style={{ pointerEvents: "none" }}>
                    {n.title}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Top-right HUD */}
        <div style={{
          position: "absolute", top: 14, right: 14,
          display: "flex", gap: 8,
        }}>
          <div className="meta-pill" style={{ display: "inline-flex" }}>
            <span className="lbl">SHOWING</span>
            <b>{nodes.filter(visible).length}</b>
            <span className="t-faint">/</span>
            <span>{nodes.length} notes</span>
          </div>
          <div className="meta-pill" style={{ display: "inline-flex" }}>
            <span className="lbl">EDGES</span>
            <b>{edges.length}</b>
          </div>
        </div>

        {/* Bottom hint */}
        <div style={{
          position: "absolute", bottom: 12, left: 12,
          fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-faint)", letterSpacing: "0.08em",
        }}>
          HOVER · HIGHLIGHTS NEIGHBORS · CLICK · OPENS PREVIEW · DRAG TO PAN (DISABLED IN MOCK)
        </div>
      </div>

      {/* Right preview */}
      {selected && <GraphPreview node={nodes.find(n => n.id === selected)} adj={adj} nodes={nodes} onClose={() => setSelected(null)} />}
    </div>
  );
};

const GraphPreview = ({ node, adj, nodes, onClose }) => {
  const neighbors = (adj.get(node.id) || []).map(id => nodes.find(n => n.id === id)).filter(Boolean);
  return (
    <div style={{
      width: 340, borderLeft: "1px solid var(--border)",
      background: "rgba(15,19,34,0.6)",
      display: "flex", flexDirection: "column", minHeight: 0,
    }}>
      <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div className="card__title"><I.File size={11} /><span>Node preview</span></div>
        <button className="btn btn--ghost btn--sm" onClick={onClose}><I.X size={11} /></button>
      </div>
      <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <AreaDot area={node.area} />
          <span className="t-mono" style={{ fontSize: 10, color: "var(--text-dim)" }}>{node.area}</span>
        </div>
        <div style={{ marginTop: 8, color: "var(--text-hi)", fontSize: 18, fontWeight: 600, letterSpacing: "-0.01em" }}>
          {node.title}
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 8, alignItems: "center" }}>
          <StatusBadge status={node.status} />
          <span className="t-mono t-faint" style={{ fontSize: 10 }}>{node.inbound} inbound · {neighbors.length} edges</span>
        </div>
      </div>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border)" }}>
        <div className="t-label" style={{ marginBottom: 8 }}>CONNECTED · {neighbors.length}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 240, overflow: "auto" }}>
          {neighbors.map(nb => (
            <div key={nb.id} style={{
              display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 8, alignItems: "center",
              padding: "6px 8px", borderRadius: 4, background: "rgba(148,158,200,0.025)",
            }}>
              <AreaDot area={nb.area} size={6} />
              <div style={{ color: "var(--text)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nb.title}</div>
              <StatusBadge status={nb.status} />
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: 10, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button className="btn btn--accent" style={{ justifyContent: "center" }}><I.Eye size={11} /> Open page</button>
        <button className="btn" style={{ justifyContent: "center" }}><I.Sparkle size={11} /> Study this</button>
      </div>
    </div>
  );
};

Object.assign(window, { Graph });
