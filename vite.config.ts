import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase";
            if (id.includes("gsap") || id.includes("framer-motion")) return "animation";
            if (id.includes("lucide-react") || id.includes("@radix-ui")) return "ui";
            if (id.includes("maplibre-gl") || id.includes("leaflet")) return "maps";
            if (id.includes("recharts")) return "charts";
            if (id.includes("jspdf") || id.includes("html2canvas")) return "pdf";
            if (id.includes("stripe")) return "stripe";
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router-dom") || id.includes("@tanstack")) return "vendor";
            return "others";
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
}));
