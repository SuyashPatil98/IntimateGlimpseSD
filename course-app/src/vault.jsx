/* global React, I, AREAS, AREA_ORDER, StatusBadge, AreaDot, Card */

const { useState, useMemo } = React;

// =========================================================
// MOCK VAULT NOTES — for explorer (extends graph nodes with metadata)
// =========================================================
const VAULT_NOTES = [
  { page: "consensus/raft.md",                    title: "Raft",                            area: "distributed-systems",     status: "comprehensive", inbound: 14, words: 4_120, modified: "2d",   snippet: "Leader election, log replication, and safety in a strongly-consistent replicated state machine." },
  { page: "consensus/paxos.md",                   title: "Paxos",                           area: "distributed-systems",     status: "mature",        inbound: 9,  words: 2_840, modified: "5d",   snippet: "Synod algorithm, multi-Paxos optimizations, why Raft is easier to reason about in practice." },
  { page: "consensus/paxos-vs-raft.md",           title: "Paxos vs Raft — when each wins",  area: "distributed-systems",     status: "draft",         inbound: 3,  words: 720,   modified: "8h",   snippet: "Both are crash-tolerant CFT consensus. Raft constrains leader election; Paxos lets any acceptor propose…" },
  { page: "consensus/vector-clocks.md",           title: "Vector Clocks",                   area: "distributed-systems",     status: "mature",        inbound: 7,  words: 1_640, modified: "12d",  snippet: "Causal ordering of events. How Dynamo, Riak, and CRDTs use VCs to detect conflicts." },
  { page: "consensus/2pc.md",                     title: "Two-Phase Commit",                area: "distributed-systems",     status: "draft",         inbound: 5,  words: 1_120, modified: "21d",  snippet: "Coordinator-prepare, then commit. Blocks on coordinator failure — why Saga & 3PC exist." },

  { page: "db/lsm-tree.md",                       title: "LSM Tree",                        area: "databases",               status: "mature",        inbound: 11, words: 3_240, modified: "3d",   snippet: "Write-optimized: MemTable → SSTables → compaction. Used by RocksDB, Cassandra, ScyllaDB." },
  { page: "db/btree.md",                          title: "B-Tree",                          area: "databases",               status: "mature",        inbound: 9,  words: 2_180, modified: "9d",   snippet: "Read-optimized, in-place updates. Why Postgres / InnoDB pick it for the primary store." },
  { page: "db/lsm-vs-btree.md",                   title: "LSM Trees vs B-Trees",            area: "databases",               status: "comprehensive", inbound: 8,  words: 5_120, modified: "17m",  snippet: "Write-amp, read-amp, space-amp triangle. Workload-driven decision matrix." },
  { page: "db/wal-and-replication.md",            title: "Write-Ahead Log & Replication",   area: "databases",               status: "comprehensive", inbound: 12, words: 4_540, modified: "9d",   snippet: "WAL as the source of truth. Physical vs logical replication; sync vs async vs quorum." },
  { page: "db/mvcc.md",                           title: "MVCC",                            area: "databases",               status: "draft",         inbound: 4,  words: 820,   modified: "1mo",  snippet: "Multi-version concurrency control. How Postgres avoids read-write blocking via tuple versions." },

  { page: "networking/tcp-congestion.md",         title: "TCP Congestion Control",          area: "networking",              status: "mature",        inbound: 6,  words: 1_960, modified: "14d",  snippet: "Reno, CUBIC, BBR. Why BBR's bandwidth-delay product model is the right idea." },
  { page: "networking/quic.md",                   title: "QUIC",                            area: "networking",              status: "draft",         inbound: 3,  words: 640,   modified: "22d",  snippet: "HTTP/3 transport on UDP. 0-RTT, connection migration, multiplexed streams without HoL blocking." },

  { page: "storage/object-storage.md",            title: "Object Storage",                  area: "storage",                 status: "mature",        inbound: 5,  words: 2_240, modified: "6d",   snippet: "S3 semantics, eventual vs strong consistency, multipart uploads, intelligent tiering trade-offs." },
  { page: "storage/block-vs-file.md",             title: "Block vs File",                   area: "storage",                 status: "stub",          inbound: 2,  words: 240,   modified: "2mo",  snippet: "Different abstractions, different latency profiles. (Stub — needs filling out.)" },

  { page: "messaging/kafka-exactly-once.md",      title: "Kafka Exactly-Once",              area: "messaging",               status: "mature",        inbound: 10, words: 3_640, modified: "4m",   snippet: "Idempotent producers, transactional writes, consume-process-produce loops. Where it breaks in practice." },
  { page: "messaging/idempotent-producers.md",    title: "Idempotent Producers",            area: "messaging",               status: "mature",        inbound: 7,  words: 1_640, modified: "1h",   snippet: "PID + sequence numbers. Why the broker can detect retries without coordination." },
  { page: "messaging/transaction-coordinator.md", title: "Transaction Coordinator",         area: "messaging",               status: "draft",         inbound: 4,  words: 820,   modified: "6d",   snippet: "How __transaction_state persists transactional state and fences zombies." },
  { page: "messaging/exactly-once-myths.md",      title: "Exactly-Once Myths",              area: "messaging",               status: "draft",         inbound: 2,  words: 540,   modified: "3mo",  snippet: "Long transactions are 'always safe up to 15 minutes' — actually a footgun. CONFLICTS with kafka-exactly-once.md." },

  { page: "caching/cache-aside.md",               title: "Cache Aside",                     area: "caching",                 status: "mature",        inbound: 8,  words: 1_840, modified: "11d",  snippet: "Read-through-on-miss, write-around / write-through / write-behind variants & their failure modes." },
  { page: "caching/ttl-policies.md",              title: "TTL Policies",                    area: "caching",                 status: "draft",         inbound: 5,  words: 740,   modified: "18d",  snippet: "Fixed-window vs sliding TTL. Why stale-while-revalidate beats both for read-heavy workloads." },

  { page: "reliability/circuit-breakers.md",      title: "Circuit Breakers",                area: "reliability",             status: "draft",         inbound: 6,  words: 1_240, modified: "1d",   snippet: "Half-open state, hystrix-style thread-pool isolation, modern variants in service meshes." },
  { page: "reliability/bulkheads.md",             title: "Bulkheads",                       area: "reliability",             status: "stub",          inbound: 2,  words: 320,   modified: "1mo",  snippet: "Failure isolation by partitioning. (Stub.)" },
  { page: "reliability/backpressure.md",          title: "Backpressure",                    area: "reliability",             status: "mature",        inbound: 7,  words: 2_140, modified: "8d",   snippet: "Token buckets, leaky buckets, reactive streams. How RxJS, Akka, and gRPC each express it." },

  { page: "patterns/cqrs-event-sourcing.md",      title: "CQRS + Event Sourcing",           area: "architecture-patterns",   status: "draft",         inbound: 8,  words: 1_840, modified: "1h",   snippet: "Separate write & read models; persist events not state. Synergy with outbox + projection rebuilds." },
  { page: "patterns/saga.md",                     title: "Saga",                            area: "architecture-patterns",   status: "mature",        inbound: 6,  words: 2_440, modified: "16d",  snippet: "Orchestration vs choreography. Compensating transactions. When the failure isolation is worth the complexity." },
  { page: "patterns/hexagonal.md",                title: "Hexagonal Architecture",          area: "architecture-patterns",   status: "mature",        inbound: 5,  words: 1_640, modified: "29d",  snippet: "Ports & adapters. Decouples domain from I/O so the same logic is testable in-memory and over real wires." },

  { page: "patterns/idempotency-keys.md",         title: "Idempotency Keys",                area: "design-patterns",         status: "comprehensive", inbound: 13, words: 4_840, modified: "5d",   snippet: "Client-generated keys, server-side dedupe windows. The pattern that makes 'at-least-once' production-safe." },
  { page: "patterns/outbox.md",                   title: "Outbox Pattern",                  area: "design-patterns",         status: "mature",        inbound: 9,  words: 2_140, modified: "11d",  snippet: "Atomic 'persist + emit' via a database table. The trade-off vs CDC and dual writes." },

  { page: "swe/testing-pyramid.md",               title: "Testing Pyramid",                 area: "software-engineering",    status: "draft",         inbound: 3,  words: 940,   modified: "23d",  snippet: "Unit / service / e2e ratios. Why the trophy and honeycomb shapes win for HTTP-heavy backends." },

  { page: "de/lambda-architecture.md",            title: "Lambda Architecture",             area: "data-engineering",        status: "stub",          inbound: 2,  words: 280,   modified: "2mo",  snippet: "Batch + speed layer + serving layer. (Stub.)" },
  { page: "de/medallion.md",                      title: "Medallion: Bronze/Silver/Gold",   area: "data-engineering",        status: "stub",          inbound: 1,  words: 320,   modified: "2mo",  snippet: "Lakehouse data refinement stages. (Stub.)" },

  { page: "ml-systems/feature-stores.md",         title: "Feature Stores: online + offline", area: "ml-systems",             status: "stub",          inbound: 2,  words: 380,   modified: "1mo",  snippet: "Feast, Tecton. Training/serving skew. (Stub — TODO: write up Feast offline-online sync.)" },
  { page: "ml-systems/online-vs-offline.md",      title: "Online vs Offline Serving",       area: "ml-systems",              status: "stub",          inbound: 1,  words: 240,   modified: "2mo",  snippet: "Real-time vs batch inference economics. (Stub.)" },

  { page: "sdi/tinder.md",                        title: "Tinder Architecture",             area: "system-design-interview", status: "draft",         inbound: 4,  words: 1_640, modified: "19d",  snippet: "Recommendation pipeline, geo-sharded ELO. The 'cold-start matchmaking' problem." },
  { page: "sdi/url-shortener.md",                 title: "URL Shortener",                   area: "system-design-interview", status: "mature",        inbound: 6,  words: 2_240, modified: "31d",  snippet: "Hash vs counter ID schemes; analytics fan-out; preventing rebind & cache stampede." },

  { page: "case/discord-voice.md",                title: "Discord Voice Architecture",      area: "case-studies",            status: "draft",         inbound: 3,  words: 1_240, modified: "11d",  snippet: "WebRTC + SFU mesh, geographic routing, low-latency mixing on consumer hardware." },
  { page: "case/figma-crdt.md",                   title: "Figma OT/CRDT",                   area: "case-studies",            status: "draft",         inbound: 4,  words: 1_840, modified: "2d",   snippet: "Why Figma uses neither pure OT nor pure CRDT but a tree-based hybrid with last-writer-wins per field." },
];

// =========================================================
// VAULT EXPLORER
// =========================================================
const Vault = () => {
  const [q, setQ] = useState("");
  const [areas, setAreas] = useState(new Set());        // empty = all
  const [statuses, setStatuses] = useState(new Set());  // empty = all
  const [sort, setSort] = useState("recent");
  const [layout, setLayout] = useState("grid");         // grid | list
  const [notes, setNotes] = useState(VAULT_NOTES);
  const [open, setOpen] = useState(null);               // note opened in the detail modal
  React.useEffect(() => {
    fetch("/api/vault/notes").then((r) => (r.ok ? r.json() : null)).then((d) => {
      if (Array.isArray(d) && d.length) setNotes(d);
    }).catch(() => {});
  }, []);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    let res = notes.filter(n => {
      if (areas.size && !areas.has(n.area)) return false;
      if (statuses.size && !statuses.has(n.status)) return false;
      if (ql && !(n.title.toLowerCase().includes(ql) || n.page.toLowerCase().includes(ql) || n.snippet.toLowerCase().includes(ql))) return false;
      return true;
    });
    const score = (n) => sort === "recent" ? -(modAge(n.modified)) :
                        sort === "inbound" ? n.inbound :
                        sort === "size"    ? n.words :
                                             n.title.toLowerCase();
    res = [...res].sort((a, b) => (score(a) < score(b) ? -1 : 1));
    if (sort !== "title") res = res.reverse();
    return res;
  }, [q, areas, statuses, sort, notes]);

  const totals = useMemo(() => ({
    stub: notes.filter(n => n.status === "stub").length,
    draft: notes.filter(n => n.status === "draft").length,
    mature: notes.filter(n => n.status === "mature").length,
    comprehensive: notes.filter(n => n.status === "comprehensive").length,
  }), [notes]);

  const toggleSet = (setter, val) => setter(s => {
    const n = new Set(s);
    n.has(val) ? n.delete(val) : n.add(val);
    return n;
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      {/* Toolbar */}
      <div style={{
        padding: "14px 20px",
        borderBottom: "1px solid var(--border)",
        display: "flex", flexDirection: "column", gap: 12,
        background: "rgba(15,19,34,0.4)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.01em" }}>
              Vault
            </h1>
            <span className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)" }}>
              <b style={{ color: "var(--text-hi)" }}>{filtered.length}</b> of {notes.length} shown
              <span style={{ color: "var(--text-faint)", margin: "0 6px" }}>·</span>
              <span className="t-amber">{totals.stub} stub</span> ·
              <span style={{ color: "var(--neon-amber)", marginLeft: 4 }}>{totals.draft} draft</span> ·
              <span style={{ color: "var(--neon-green)", marginLeft: 4 }}>{totals.mature} mature</span> ·
              <span style={{ color: "var(--accent-hi)", marginLeft: 4 }}>{totals.comprehensive} comprehensive</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn btn--sm"><I.Plus size={11} /> New note</button>
            <button className="btn btn--sm btn--accent"><I.Compile size={11} /> Lint vault</button>
          </div>
        </div>

        {/* Search row */}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ flex: 1, position: "relative" }}>
            <I.Search size={13} stroke="var(--text-dim)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search title, body, path…"
              style={{
                width: "100%", padding: "9px 12px 9px 36px",
                background: "var(--bg-deep)", border: "1px solid var(--border)",
                borderRadius: 8, color: "var(--text-hi)",
                fontFamily: "var(--font-body)", fontSize: 13, outline: "none",
              }}
            />
            {q && (
              <button onClick={() => setQ("")} style={{
                position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                color: "var(--text-faint)", padding: 2,
              }}>
                <I.X size={11} />
              </button>
            )}
          </div>

          <select className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="recent">most recent</option>
            <option value="inbound">most linked</option>
            <option value="size">word count</option>
            <option value="title">A → Z</option>
          </select>

          <div style={{ display: "flex", border: "1px solid var(--border)", borderRadius: 6, overflow: "hidden" }}>
            <button onClick={() => setLayout("grid")} style={{
              padding: "6px 10px",
              background: layout === "grid" ? "var(--bg-elevated)" : "transparent",
              color: layout === "grid" ? "var(--text-hi)" : "var(--text-dim)",
              borderRight: "1px solid var(--border)",
            }}>
              <I.Layers size={12} />
            </button>
            <button onClick={() => setLayout("list")} style={{
              padding: "6px 10px",
              background: layout === "list" ? "var(--bg-elevated)" : "transparent",
              color: layout === "list" ? "var(--text-hi)" : "var(--text-dim)",
            }}>
              <I.File size={12} />
            </button>
          </div>
        </div>

        {/* Filter chips */}
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <span className="t-label">AREAS</span>
          {AREA_ORDER.map(a => {
            const on = areas.has(a);
            const c = AREAS[a].color;
            return (
              <button key={a} onClick={() => toggleSet(setAreas, a)} style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "3px 10px", borderRadius: 999,
                background: on ? `color-mix(in oklab, ${c} 12%, transparent)` : "transparent",
                border: `1px solid ${on ? c : "var(--border)"}`,
                color: on ? "var(--text-hi)" : "var(--text-dim)",
                fontSize: 11, fontFamily: "var(--font-mono)",
                transition: "all 120ms",
              }}>
                <AreaDot area={a} size={6} />
                {AREAS[a].short}
              </button>
            );
          })}
          {areas.size > 0 && (
            <button onClick={() => setAreas(new Set())} className="btn btn--ghost btn--sm">
              <I.X size={10} /> Clear
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <span className="t-label">STATUS</span>
          {["stub","draft","mature","comprehensive"].map(s => {
            const on = statuses.has(s);
            return (
              <button key={s} onClick={() => toggleSet(setStatuses, s)} style={{
                opacity: on ? 1 : 0.55,
                transform: on ? "scale(1)" : "scale(0.97)",
                transition: "all 120ms",
              }}>
                <StatusBadge status={s} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflow: "auto", padding: "18px 20px" }}>
        {filtered.length === 0 ? (
          <EmptyState onClear={() => { setQ(""); setAreas(new Set()); setStatuses(new Set()); }} />
        ) : layout === "grid" ? (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 12,
          }}>
            {filtered.map(n => <NoteCard key={n.page} n={n} onOpen={setOpen} />)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {filtered.map(n => <NoteRow key={n.page} n={n} onOpen={setOpen} />)}
          </div>
        )}
      </div>

      {open && <NoteDetail note={open} onClose={() => setOpen(null)} />}
    </div>
  );
};

// =========================================================
// NOTE DETAIL — opens the real page body via /api/page/{name}
// =========================================================
const NoteDetail = ({ note, onClose }) => {
  const [page, setPage] = useState({ _loading: true });
  React.useEffect(() => {
    let alive = true;
    fetch("/api/page/" + encodeURIComponent(note.page))
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (alive) setPage(d ? { ...d, _loading: false } : { _loading: false, _error: true }); })
      .catch(() => { if (alive) setPage({ _loading: false, _error: true }); });
    return () => { alive = false; };
  }, [note.page]);

  const def = AREAS[note.area] || { color: "var(--text-faint)", label: note.area || "unknown" };

  return (
    <div className="modal-veil" onClick={onClose}>
      <div className="modal" style={{ width: "min(840px, 92vw)", maxHeight: "86vh", display: "flex", flexDirection: "column" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <AreaDot area={note.area} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: "var(--text-hi)", letterSpacing: "-0.01em" }}>{note.title}</div>
            <div className="t-mono" style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 3 }}>{def.label} · {note.page}</div>
          </div>
          <StatusBadge status={note.status} />
          <button className="btn btn--ghost btn--sm" onClick={onClose} style={{ marginLeft: 10 }}><I.X size={12} /></button>
        </div>
        <div style={{ overflow: "auto", padding: "18px 22px", fontFamily: "var(--font-body)", color: "var(--text-body)", fontSize: 13.5, lineHeight: 1.7, whiteSpace: "pre-wrap", minHeight: 0 }}>
          {page._loading ? <span className="t-faint">Loading…</span>
            : page._error ? <span className="t-faint">Could not load this page.</span>
            : (page.body || note.snippet || "(empty page)")}
        </div>
      </div>
    </div>
  );
};

const NoteCard = ({ n, onOpen }) => {
  const def = AREAS[n.area] || { color: "var(--text-faint)", short: (n.area || "?").toUpperCase() };
  return (
    <button onClick={() => onOpen && onOpen(n)} style={{
      display: "flex", flexDirection: "column",
      padding: 14, gap: 10,
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderTop: `1px solid ${def.color}55`,
      borderRadius: 8, textAlign: "left",
      transition: "border-color 120ms, transform 120ms, box-shadow 120ms",
      position: "relative",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-line)"; e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--glow-soft)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "none"; }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <AreaDot area={n.area} size={7} />
          <span className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", letterSpacing: 0.2 }}>{def.short}</span>
        </div>
        <StatusBadge status={n.status} />
      </div>

      <div style={{ color: "var(--text-hi)", fontSize: 14, fontWeight: 600, lineHeight: 1.25, letterSpacing: "-0.005em" }}>
        {n.title}
      </div>

      <div style={{ color: "var(--text-body)", fontSize: 12, lineHeight: 1.5, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {n.snippet}
      </div>

      <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px dashed var(--border)" }}>
        <span className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)" }}>
          {n.page}
        </span>
        <div style={{ display: "flex", gap: 10, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--text-dim)" }}>
          <span><I.Link size={9} style={{ marginRight: 2, verticalAlign: "middle" }} />{n.inbound}</span>
          <span>{(n.words/1000).toFixed(1)}k</span>
          <span>{n.modified}</span>
        </div>
      </div>
    </button>
  );
};

const NoteRow = ({ n, onOpen }) => {
  const def = AREAS[n.area] || { color: "var(--text-faint)", short: (n.area || "?").toUpperCase() };
  return (
    <button onClick={() => onOpen && onOpen(n)} style={{
      display: "grid",
      gridTemplateColumns: "8px 1.2fr 2fr auto auto auto auto",
      gap: 14, alignItems: "center",
      padding: "10px 14px",
      borderRadius: 6,
      background: "var(--bg-card)",
      border: "1px solid var(--border)",
      textAlign: "left",
      transition: "border-color 120ms",
    }}
    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-line)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}>
      <AreaDot area={n.area} size={8} />
      <div style={{ minWidth: 0 }}>
        <div style={{ color: "var(--text-hi)", fontSize: 13, fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.title}</div>
        <div className="t-mono" style={{ fontSize: 10, color: "var(--text-faint)", marginTop: 2 }}>{n.page}</div>
      </div>
      <div style={{ color: "var(--text-body)", fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{n.snippet}</div>
      <StatusBadge status={n.status} />
      <span className="t-mono t-num" style={{ fontSize: 11, color: "var(--text-dim)", width: 32, textAlign: "right" }}>{n.inbound}<I.Link size={9} stroke="var(--text-faint)" style={{ marginLeft: 4, verticalAlign: "middle" }} /></span>
      <span className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)", width: 50, textAlign: "right" }}>{(n.words/1000).toFixed(1)}k</span>
      <span className="t-mono" style={{ fontSize: 11, color: "var(--text-faint)", width: 50, textAlign: "right" }}>{n.modified}</span>
    </button>
  );
};

const EmptyState = ({ onClear }) => (
  <div style={{
    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
    padding: "80px 20px",
    color: "var(--text-dim)", textAlign: "center",
  }}>
    <I.Search size={32} stroke="var(--text-faint)" />
    <div style={{ marginTop: 14, color: "var(--text-hi)", fontSize: 16, fontWeight: 600 }}>No notes match</div>
    <div style={{ marginTop: 6, fontSize: 12 }}>Try clearing some filters, or write a new note for this query.</div>
    <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
      <button className="btn btn--sm" onClick={onClear}><I.X size={11} /> Clear filters</button>
      <button className="btn btn--sm btn--accent"><I.Plus size={11} /> Create from query</button>
    </div>
  </div>
);

function modAge(s) {
  // tiny helper for sort
  const m = /(\d+)([a-z]+)/.exec(s);
  if (!m) return 0;
  const n = parseInt(m[1], 10);
  const u = m[2];
  const mul = { m: 1, h: 60, d: 60*24, mo: 60*24*30 }[u] || 0;
  return n * mul;
}

Object.assign(window, { Vault });
