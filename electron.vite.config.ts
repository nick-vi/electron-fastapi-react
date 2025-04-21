import { defineConfig } from "electron-vite";
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
  },
  preload: {
    build: {
      outDir: "dist-electron/preload",
      rollupOptions: {
        input: {
          index: resolve(__dirname, "src/preload/index.ts"),
        },
      },
      // Use CommonJS format for preload script
      lib: {
        entry: "src/preload/index.ts",
        formats: ["cjs"],
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
  },
});
