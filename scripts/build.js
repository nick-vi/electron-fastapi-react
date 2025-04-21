import { exec } from "child_process";
import { build } from "electron-builder";
import { build as viteBuild } from "electron-vite";
import { existsSync, rmSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Get package.json version
const pkg = require("../package.json");
const version = pkg.version;

const platform = process.env.PLATFORM || process.platform;
const isWindows = platform === "win" || process.platform === "win32";
const isMac = platform === "mac" || process.platform === "darwin";

console.log(`🚀 Building Electron FastAPI Sidecar v${version} for ${platform}...`);

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

  // Check for Node.js (required)
  if (!(await checkCommand("node"))) {
    throw new Error("Node.js is required but not installed. Please install Node.js 18 or later.");
  }
  console.log("✓ Node.js is installed");

  // Check for pnpm (required)
  if (!(await checkCommand("pnpm"))) {
    throw new Error(
      "pnpm is required but not installed. Please install pnpm using 'npm install -g pnpm'."
    );
  }
  console.log("✓ pnpm is installed");

  // Check for Python (required)
  const pythonCmd = isWindows ? "python" : "python3";
  if (!(await checkCommand(pythonCmd))) {
    throw new Error(
      `${pythonCmd} is required but not installed. Please install Python 3.9 or later.`
    );
  }
  console.log("✓ Python is installed");

  // Check for uv (required)
  if (!(await checkCommand("uv"))) {
    throw new Error("uv is required but not installed. Please install uv using 'pip install uv'.");
  }
  console.log("✓ uv is installed");
}

async function buildFastAPI() {
  console.log("\n🔨 Building FastAPI application...");

  const specFile = join(projectRoot, "api", "api.spec");

  // Get the correct path to the Python executable in the virtual environment
  const venvPath = join(projectRoot, "api", ".venv");
  const venvBinDir = isWindows ? join(venvPath, "Scripts") : join(venvPath, "bin");
  const venvPython = join(venvBinDir, isWindows ? "python.exe" : "python");

  // Install PyInstaller if needed
  await execAsync("uv pip install pyinstaller", { cwd: join(projectRoot, "api") });

  // Generate spec file if it doesn't exist
  if (!existsSync(specFile)) {
    // Use platform-specific path separator for --add-data
    const pathSep = isWindows ? ";" : ":";

    const pyiArgs = [
      "-m",
      "PyInstaller",
      "--name",
      "api",
      "--add-data",
      `pyproject.toml${pathSep}./`,
      "--hidden-import",
      "uvicorn.logging",
      "--hidden-import",
      "uvicorn.protocols",
      "--hidden-import",
      "uvicorn.protocols.http",
      "--hidden-import",
      "uvicorn.protocols.http.auto",
      "--hidden-import",
      "uvicorn.protocols.websockets",
      "--hidden-import",
      "uvicorn.protocols.websockets.auto",
      "--hidden-import",
      "uvicorn.lifespan",
      "--hidden-import",
      "uvicorn.lifespan.on",
      "--hidden-import",
      "uvicorn.lifespan.off",
      "run.py",
    ].join(" ");

    await execAsync(`"${venvPython}" ${pyiArgs}`, { cwd: join(projectRoot, "api") });
  }

  // Build with PyInstaller
  await execAsync(`"${venvPython}" -m PyInstaller api.spec`, { cwd: join(projectRoot, "api") });
}

async function buildElectron() {
  console.log("\n📦 Building Electron application...");

  // Clean previous builds
  rmSync(join(projectRoot, "dist"), { recursive: true, force: true });
  rmSync(join(projectRoot, "dist-electron"), { recursive: true, force: true });

  // Build with electron-vite
  await viteBuild();

  // Build with electron-builder
  await build({
    config: {
      ...pkg.build,
      [platform]: pkg.build[platform],
    },
    [platform]: true,
  });
}

async function main() {
  try {
    const startTime = Date.now();

    // Check dependencies but don't set up environment
    await checkDependencies();

    // Build the FastAPI application
    await buildFastAPI();

    // Build the Electron application
    await buildElectron();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Build completed in ${duration}s`);
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);
    process.exit(1);
  }
}

main();
