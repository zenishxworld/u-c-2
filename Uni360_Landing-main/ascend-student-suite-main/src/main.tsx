import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

// ─── Production safety: suppress all console output outside dev ───────────────
// This single block is the canonical place to silence logs so we never need
// to touch every individual file. In dev mode (vite serve) this is skipped
// entirely so developer experience is unchanged.
if (!import.meta.env.DEV) {
  const noop = () => undefined;
  console.log   = noop;
  console.info  = noop;
  console.debug = noop;
  console.warn  = noop;
  // console.error is intentionally left active so unhandled runtime errors
  // still surface in production monitoring tools (e.g. Sentry, browser).
}
// ─────────────────────────────────────────────────────────────────────────────

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;

if (!GOOGLE_CLIENT_ID) {
  throw new Error(
    '[main.tsx] VITE_GOOGLE_CLIENT_ID is not set. ' +
    'Add it to your .env file before starting the app.'
  );
}

createRoot(document.getElementById('root')!).render(
  <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <App />
  </GoogleOAuthProvider>
);