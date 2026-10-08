import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // bind to 0.0.0.0 — required for Docker port forwarding
    // Local-dev only: proxies backend paths to a local backend so the Vite
    // dev server behaves like the split production topology (absolute
    // VITE_BACKEND_URL in the built app). No effect on production builds.
    proxy: {
      "/api": {
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
        ws: true,   // forward WebSocket upgrade requests (voice pipeline)
      },
      "/outputs": {
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/uploads": {
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/static": {
        target: process.env.VITE_PROXY_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
});
