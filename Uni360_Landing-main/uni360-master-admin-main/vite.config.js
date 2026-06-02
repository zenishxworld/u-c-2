import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    target: "es2020",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        format: "es",
        manualChunks: {
          vendor: ["react", "react-dom"],
          router: ["react-router-dom"],
          state: ["@reduxjs/toolkit", "react-redux"],
        },
      },
    },
  },
  esbuild: {
    drop: ["console", "debugger"],
  },
  server: {
    port: 5173,
    host: true,
  },
});
