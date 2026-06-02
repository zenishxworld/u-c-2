import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { apiPlugin } from "./vite-api-plugin";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    apiPlugin(),          // ← Embeds /api/* routes into the Vite dev server
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Prevent Vite from trying to process Node.js-only packages for the browser
  optimizeDeps: {
    exclude: ['pg', 'pg-native', 'pg-pool', 'pgpass'],
  },
}));

