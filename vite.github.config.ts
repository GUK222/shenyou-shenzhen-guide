import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  root: "github-pages",
  base: "/shenyou-shenzhen-guide/",
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist-pages",
    emptyOutDir: true,
    rolldownOptions: {
      output: {
        codeSplitting: {
          minSize: 20_000,
          groups: [
            {
              name: "react",
              test: /node_modules[\\/](react|react-dom)[\\/]/,
              priority: 3,
            },
            {
              name: "icons",
              test: /node_modules[\\/]@phosphor-icons[\\/]/,
              priority: 2,
            },
            {
              name: "vendor",
              test: /node_modules[\\/]/,
              priority: 1,
            },
          ],
        },
      },
    },
  },
});
