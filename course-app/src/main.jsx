// Entry point. Order matters: the React-global shim first, then shared atoms,
// then the screens (each publishes itself on window), then app.jsx — which
// self-mounts via ReactDOM.createRoot and references every screen as a global.
import "./_react-global.js";
import "./api.js";
import "./tokens.css";
import "./shared.jsx";
import "./dashboard.jsx";
import "./study.jsx";
import "./vault.jsx";
import "./graph.jsx";
import "./flashcards.jsx";
import "./roadmap.jsx";
import "./ingest.jsx";
import "./profile.jsx";
import "./app.jsx";
