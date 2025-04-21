import { spawn } from "child_process";
import { exec } from "child_process";
import crypto from "crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { promisify } from "util";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

// Read package.json
const packageJsonPath = join(projectRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

const platform = process.env.PLATFORM || process.platform;
const isWindows = platform === "win" || process.platform === "win32";
const forceRebuild = process.argv.includes("--force");
const useOnedir = process.argv.includes("--onedir");

// PyInstaller packaging mode
const packagingMode = useOnedir ? "--onedir" : "--onefile";

console.log(`🚀 Building Electron FastAPI Sidecar v${version} for ${platform}...`);

function spawnAsync(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(command, args, { stdio: "inherit", ...options });
    proc.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with code ${code}`));
      }
    });
    proc.on("error", reject);
  });
}

async function generateSourceHash() {
  const apiDir = join(projectRoot, "api");
  const { glob } = await import("glob");
  const files = await glob("**/*.py", {
    cwd: apiDir,
    ignore: ["**/__pycache__/**", "**/.venv/**"],
  });
  let hash = crypto.createHash("sha256");

  for (const file of files) {
    const filePath = join(apiDir, file);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, "utf-8");
      hash.update(content);
    }
  }

  const pyprojectPath = join(apiDir, "pyproject.toml");
  if (existsSync(pyprojectPath)) {
    const content = readFileSync(pyprojectPath, "utf-8");
    hash.update(content);
  }

  return hash.digest("hex");
}

async function shouldRebuild() {
  if (forceRebuild) {
    console.log("🔄 Force rebuild requested");
    return true;
  }

  const apiDir = join(projectRoot, "api");
  const cacheFile = join(apiDir, ".build-cache");
  const distDir = join(apiDir, "dist", "api");

  // Check if dist exists
  if (!existsSync(distDir)) {
    console.log("🆕 Build directory not found, rebuild required");
    return true;
  }

  try {
    const currentHash = await generateSourceHash();
    const cacheContent = readFileSync(cacheFile, "utf-8");
    const needsRebuild = cacheContent.trim() !== currentHash;
    if (needsRebuild) {
      console.log("🔄 Source files changed, rebuild required");
    }
    return needsRebuild;
  } catch {
    console.log("🆕 No cache file found, rebuild required");
    return true;
  }
}

async function updateBuildCache() {
  const hash = await generateSourceHash();
  writeFileSync(join(projectRoot, "api", ".build-cache"), hash);
  console.log("✅ Build cache updated");
}

async function buildFastAPI() {
  console.log("\n🔨 Building FastAPI application...");

  const apiDir = join(projectRoot, "api");
  const specFile = join(apiDir, "api.spec");
  const distDir = join(apiDir, "dist", "api");

  // Clean dist if force rebuild
  if (forceRebuild && existsSync(distDir)) {
    console.log("🧹 Cleaning previous build...");
    rmSync(distDir, { recursive: true, force: true });
  }

  const venvPath = join(apiDir, ".venv");
  const venvBinDir = isWindows ? join(venvPath, "Scripts") : join(venvPath, "bin");
  const venvPython = join(venvBinDir, isWindows ? "python.exe" : "python");

  await spawnAsync("uv", ["pip", "install", "pyinstaller"], { cwd: apiDir });

  if (!existsSync(specFile)) {
    const pathSep = isWindows ? ";" : ":";

    // Get all installed packages using uv pip freeze
    console.log("📦 Extracting installed Python packages...");
    const { stdout: pipFreezeOutput } = await execAsync("uv pip freeze", { cwd: apiDir });

    // Parse the output to get package names
    const packageNames = pipFreezeOutput.split('\n')
      .filter(line => line.trim() && !line.startsWith('#'))
      .map(line => {
        // Extract package name (before any version specifiers)
        const match = line.match(/^([a-zA-Z0-9_-]+)(==|>=|<=|~=|!=|===|\[.*\])?/);
        return match ? match[1].toLowerCase() : null;
      })
      .filter(Boolean)
      // Filter out packages that shouldn't be included
      .filter(pkg => !['pip', 'setuptools', 'wheel', 'pyinstaller', 'pyinstaller-hooks-contrib'].includes(pkg));

    console.log("📦 Detected Python dependencies:", packageNames.join(", "));

    // Build PyInstaller arguments
    const pyiArgs = [
      "-m",
      "PyInstaller",
      "--name",
      "api",
      packagingMode,
      "--add-data",
      `pyproject.toml${pathSep}./`,
      "--add-data",
      `*.py${pathSep}./`,
    ];

    // Add all dependencies as collect-submodules
    for (const pkg of packageNames) {
      pyiArgs.push("--collect-submodules");
      pyiArgs.push(pkg);
    }

    // Add the main script
    pyiArgs.push("run.py");

    await spawnAsync(venvPython, pyiArgs, { cwd: apiDir });
  }

  await spawnAsync(venvPython, ["-m", "PyInstaller", "api.spec", "--noconfirm"], {
    cwd: apiDir,
  });

  // Make sure the binary is executable on non-Windows platforms
  if (!isWindows) {
    const binaryPath = join(distDir, "api");
    if (existsSync(binaryPath)) {
      try {
        await spawnAsync("chmod", ["+x", binaryPath]);
        console.log("✅ Made binary executable");
      } catch (error) {
        console.warn("⚠️ Failed to make binary executable:", error.message);
      }
    }
  }

  await updateBuildCache();
}

async function buildElectron() {
  console.log("\n📦 Building Electron application...");

  rmSync(join(projectRoot, "dist"), { recursive: true, force: true });
  rmSync(join(projectRoot, "dist-electron"), { recursive: true, force: true });

  console.log("\n🔨 Running electron-vite build...");
  await spawnAsync("pnpm", ["run", "build:vite"], { cwd: projectRoot });

  console.log("\n📦 Running electron-builder...");
  await spawnAsync("pnpm", ["run", "build:electron"], { cwd: projectRoot });
}

async function main() {
  try {
    const startTime = Date.now();

    console.log("\n⚙️ Running setup script...");
    await spawnAsync("node", ["scripts/setup.js"], { cwd: projectRoot });

    const needsRebuild = await shouldRebuild();
    if (needsRebuild) {
      await buildFastAPI();
    } else {
      console.log("⏭️ No changes detected in Python source files, skipping build");
    }

    await buildElectron();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`\n✅ Build completed in ${duration}s`);
  } catch (error) {
    console.error("\n❌ Build failed:", error.message);
    process.exit(1);
  }
}

main();
