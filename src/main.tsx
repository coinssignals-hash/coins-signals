import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore accessibility preferences
// Restore contrast preference
const contrastLevel = localStorage.getItem('app-contrast-level') || 'normal';
if (contrastLevel === 'low') document.documentElement.classList.add('contrast-low');
else if (contrastLevel === 'medium') document.documentElement.classList.add('high-contrast');
else if (contrastLevel === 'high') document.documentElement.classList.add('contrast-high');
if (localStorage.getItem('app-large-text') === 'true') {
  document.body.classList.add('large-text');
}

createRoot(document.getElementById("root")!).render(<App />);
