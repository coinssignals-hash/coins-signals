import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Restore accessibility preferences
if (localStorage.getItem('app-high-contrast') === 'true') {
  document.documentElement.classList.add('high-contrast');
}
if (localStorage.getItem('app-large-text') === 'true') {
  document.body.classList.add('large-text');
}

createRoot(document.getElementById("root")!).render(<App />);
