#!/usr/bin/env node

import { existsSync, rmSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const isHardClean = process.argv.includes("--hard");

console.log(`🧹 Cleaning build artifacts${isHardClean ? " (hard clean)" : ""}...`);

const dirsToClean = [
  "dist",
  "dist-electron",
  "api/dist",
  "api/build",
  "api/__pycache__",
  "node_modules/.vite",
  "api/.deps_hash",
  ...(isHardClean ? ["node_modules", "api/.venv"] : []),
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
