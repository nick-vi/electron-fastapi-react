import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import { resolve } from "path";

export default defineConfig({
  main: {
    build: {
      outDir: "dist-electron/main",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/main/index.ts"),
        },
      },
    },
    resolve: {
      alias: {
        "@common": resolve(__dirname, "src/common"),
        "@main": resolve(__dirname, "src/main"),
        "@renderer": resolve(__dirname, "src/renderer"),
        "@preload": resolve(__dirname, "src/preload"),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  preload: {
    build: {
      outDir: "dist-electron/preload",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts"),
        },
        output: {
          format: "cjs",
          entryFileNames: "[name].js",
        },
      },
    },
    resolve: {
      alias: {
        "@common": resolve(__dirname, "src/common"),
        "@main": resolve(__dirname, "src/main"),
        "@renderer": resolve(__dirname, "src/renderer"),
        "@preload": resolve(__dirname, "src/preload"),
      },
    },
    plugins: [externalizeDepsPlugin()],
  },
  renderer: {
    root: "src/renderer",
    build: {
      outDir: "dist-electron/renderer",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/renderer/index.html"),
        },
      },
    },
    resolve: {
      alias: {
        "@common": resolve(__dirname, "src/common"),
        "@main": resolve(__dirname, "src/main"),
        "@renderer": resolve(__dirname, "src/renderer"),
        "@preload": resolve(__dirname, "src/preload"),
      },
    },
    plugins: [react(), tailwindcss()],
    server: {
      watch: {
        ignored: ["**/node_modules/**", "**/.git/**"],
      },
    },
  },
});
