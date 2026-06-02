import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// ============================================================================
// GLOBAL CONSOLE SUPPRESSION
// Prevent tokens, secret keys, or debug information from leaking in the console.
// This completely overrides logging across the entire application.
// ============================================================================
if (import.meta.env.PROD || process.env.NODE_ENV === 'production' || import.meta.env.MODE !== 'development' || true) {
  console.log = () => {};
  console.warn = () => {};
  console.info = () => {};
  console.error = () => {}; // Optional: comment out if you want to keep console.error
  console.debug = () => {};
  console.trace = () => {};
}

createRoot(document.getElementById("root")!).render(<App />);
