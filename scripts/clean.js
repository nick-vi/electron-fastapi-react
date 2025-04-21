#!/usr/bin/env node

import { rmSync, existsSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

console.log("🧹 Cleaning build artifacts...");

const dirsToClean = [
  "dist",
  "dist-electron",
  "api/dist",
  "api/build",
  "api/__pycache__",
  "node_modules/.vite"
];

let cleaned = 0;

for (const dir of dirsToClean) {
  const dirPath = join(projectRoot, dir);
  if (existsSync(dirPath)) {
    try {
      rmSync(dirPath, { recursive: true, force: true });
      console.log(`✓ Removed ${dir}`);
      cleaned++;
    } catch (error) {
      console.error(`❌ Failed to remove ${dir}: ${error.message}`);
    }
  }
}

if (cleaned === 0) {
  console.log("✓ Nothing to clean");
} else {
  console.log(`\n✅ Cleaned ${cleaned} directories`);
}
