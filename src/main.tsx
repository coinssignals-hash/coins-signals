import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore accessibility preferences
const contrastLevel = localStorage.getItem('app-contrast-level') || 'normal';
if (contrastLevel === 'low') document.documentElement.classList.add('contrast-low');
else if (contrastLevel === 'medium') document.documentElement.classList.add('high-contrast');
else if (contrastLevel === 'high') document.documentElement.classList.add('contrast-high');

if (localStorage.getItem('app-large-text') === 'true') {
  document.body.classList.add('large-text');
}

// Restore font scale
const fontScale = localStorage.getItem('app-font-scale') || '100';
document.documentElement.classList.add(`font-scale-${fontScale}`);

// Restore accent color
const accentColor = localStorage.getItem('app-accent-color') || 'blue';
document.documentElement.classList.add(`accent-${accentColor}`);

// Restore reduced motion
if (localStorage.getItem('app-reduce-motion') === 'true') {
  document.documentElement.classList.add('reduce-motion');
}

// Restore compact mode
if (localStorage.getItem('app-compact-mode') === 'true') {
  document.documentElement.classList.add('compact-mode');
}

createRoot(document.getElementById("root")!).render(<App />);
