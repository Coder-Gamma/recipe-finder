import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/Recipe-Finder",
  server: {
    port: 5173,
    strictPort: true,
  },
  resolve: {
    extensions: [".js", ".jsx", ".ts", ".tsx"],
  },
  build: {
    target: "esnext",
    outDir: "dist",
    rollupOptions: {
      external: [],
    },
  },
  optimizeDeps: {
    exclude: [
      "@tensorflow/tfjs",
      "@tensorflow-models/mobilenet",
      "@tensorflow/tfjs-backend-webgl",
      "@tensorflow/tfjs-backend-cpu",
    ],
    include: [],
  },
  define: {
    global: "globalThis",
    "process.env": {},
    "process.env.NODE_ENV": JSON.stringify("development"),
    module: "undefined",
    "process.browser": true,
    "process.version": JSON.stringify("v18.0.0"),
  },
});
