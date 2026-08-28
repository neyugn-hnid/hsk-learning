import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { vercelPreset } from "@vercel/react-router/vite";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    dedupe: ["react", "react-dom", "react-router"],
  },
  server: {
    watch: {
      ignored: ["**/data/**", "**/prisma/**"],
    },
  },
  plugins: [tailwindcss(), reactRouter({ presets: [vercelPreset()] })],
});