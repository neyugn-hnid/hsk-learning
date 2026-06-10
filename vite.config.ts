import { reactRouter } from "@react-router/dev/vite";
import { vercelPreset } from "@vercel/remix/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [reactRouter({ presets: [vercelPreset()] }), tsconfigPaths()],
});