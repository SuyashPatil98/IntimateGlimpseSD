// The Claude Design components were written for a browser-Babel setup where
// React/ReactDOM are UMD globals and every file does `const { useState } = React`.
// We preserve that contract under Vite by putting them on window — and this module
// MUST be imported first (see main.jsx) so the global exists before any component
// module evaluates its top-level `= React` destructure.
import React from "react";
import { createRoot } from "react-dom/client";

window.React = React;
window.ReactDOM = { createRoot };
