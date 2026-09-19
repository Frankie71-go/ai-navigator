import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({
  // Relative base so the built site works on GitHub Pages (and any sub-path)
  base: "./",
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname) } },
  server: { host: true },
});
