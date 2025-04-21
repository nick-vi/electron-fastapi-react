#!/usr/bin/env node

import { exec } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const pkg = require("../package.json");
const version = pkg.version;

const platform = process.env.PLATFORM || process.platform;
const isWindows = platform === "win" || process.platform === "win32";

console.log(`🚀 Setting up Electron FastAPI Sidecar v${version}...`);

async function checkCommand(command) {
  try {
    await execAsync(isWindows ? `where ${command}` : `which ${command}`);
    return true;
  } catch {
    return false;
  }
}

async function checkDependencies() {
  console.log("\n🔍 Checking dependencies...");

  if (!(await checkCommand("node"))) {
    throw new Error("Node.js is required but not installed. Please install Node.js 18 or later.");
  }
  console.log("✓ Node.js is installed");

  if (!(await checkCommand("pnpm"))) {
    throw new Error(
      "pnpm is required but not installed. Please install pnpm using 'npm install -g pnpm'."
    );
  }
  console.log("✓ pnpm is installed");

  const pythonCmd = isWindows ? "python" : "python3";
  if (!(await checkCommand(pythonCmd))) {
    throw new Error(
      `${pythonCmd} is required but not installed. Please install Python 3.9 or later.`
    );
  }
  console.log("✓ Python is installed");

  if (!(await checkCommand("uv"))) {
    throw new Error("uv is required but not installed. Please install uv using 'pip install uv'.");
  }
  console.log("✓ uv is installed");
}

async function setupPython() {
  console.log("\nℹ️ Setting up Python environment...");

  if (!existsSync(join(projectRoot, "api"))) {
    mkdirSync(join(projectRoot, "api"), { recursive: true });
  }

  const { stdout: uvOutput } = await execAsync("uv venv api/.venv", { cwd: projectRoot });
  console.log(uvOutput);

  const { stdout: pipOutput } = await execAsync("uv pip install --requirements pyproject.toml", {
    cwd: join(projectRoot, "api"),
  });
  console.log(pipOutput);
}

async function setupNode() {
  console.log("\n📦 Setting up Node.js dependencies...");

  const { stdout: npmOutput } = await execAsync("pnpm install", { cwd: projectRoot });
  console.log(npmOutput);
}

async function main() {
  try {
    const startTime = Date.now();

    await checkDependencies();
    await setupPython();
    await setupNode();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Setup completed in ${duration}s`);
  } catch (error) {
    console.error("\n❌ Setup failed:", error.message);
    process.exit(1);
  }
}

main();
