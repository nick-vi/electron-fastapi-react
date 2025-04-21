import { exec, spawn } from "child_process";
import crypto from "crypto";
import { existsSync, readFileSync, rmSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");

const packageJsonPath = join(projectRoot, "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = packageJson.version;

const platform = process.env.PLATFORM || process.platform;
const isWindows = platform === "win" || process.platform === "win32";
const forceRebuild = process.argv.includes("--force");
const useOnedir = process.argv.includes("--onedir");

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

async function generateSpecHash() {
  const exclusions = {
    common: [
      // Test modules
      "*.tests",
      "*.tests.*",
      "*._tests",
      "*._tests.*",
      "*.testing",
      "*.testing.*",
      // Documentation
      "*.docs",
      "*.docs.*",
      "*.sphinxext",
      "*.sphinxext.*",
      // Examples
      "*.examples",
      "*.examples.*",
      "*.sample",
      "*.sample.*",
      // Development tools
      "*.__main__",
      "*.__pycache__",
      "*.debug",
      "*.debug.*",
      // Specific large packages with many unnecessary components
      "pygments.lexers.*",
      "pygments.styles.*",
      "rich.diagnose",
      "rich.traceback",
      // Unused protocols and backends
      "uvicorn.workers",
    ],
    platforms: {
      win32: ["win32*", "winreg", "msvcrt", "winsound", "_winapi"],
      darwin: ["macholib*", "AppKit", "Carbon", "CoreFoundation", "objc"],
      linux: ["systemd", "apt_pkg"],
    },
    asyncio: {
      win32: ["asyncio.unix_*"],
      unix: ["asyncio.windows_*"],
    },
  };

  let hash = crypto.createHash("sha256");
  hash.update(JSON.stringify(exclusions));
  return hash.digest("hex");
}

async function shouldUpdateSpec() {
  if (forceRebuild) {
    console.log("🔄 Force rebuild requested");
    return true;
  }

  const apiDir = join(projectRoot, "api");
  const specFile = join(apiDir, "api.spec");
  const specCacheFile = join(apiDir, ".spec-cache");

  if (!existsSync(specFile)) {
    console.log("🆕 Spec file not found, update required");
    return true;
  }

  try {
    const currentHash = await generateSpecHash();
    const cacheContent = readFileSync(specCacheFile, "utf-8");
    const needsUpdate = cacheContent.trim() !== currentHash;
    if (needsUpdate) {
      console.log("🔄 Exclusions changed, spec update required");
    }
    return needsUpdate;
  } catch {
    console.log("🆕 No spec cache file found, update required");
    return true;
  }
}

async function updateSpecCache() {
  const hash = await generateSpecHash();
  writeFileSync(join(projectRoot, "api", ".spec-cache"), hash);
  console.log("✅ Spec cache updated");
}

async function buildFastAPI() {
  console.log("\n🔨 Building FastAPI application...");

  const apiDir = join(projectRoot, "api");
  const distDir = join(apiDir, "dist", "api");

  if (forceRebuild && existsSync(distDir)) {
    console.log("🧹 Cleaning previous build...");
    rmSync(distDir, { recursive: true, force: true });
  }

  const venvPath = join(apiDir, ".venv");
  const venvBinDir = isWindows ? join(venvPath, "Scripts") : join(venvPath, "bin");
  const venvPython = join(venvBinDir, isWindows ? "python.exe" : "python");

  await spawnAsync("uv", ["pip", "install", "pyinstaller"], { cwd: apiDir });

  const needsSpecUpdate = await shouldUpdateSpec();
  if (needsSpecUpdate) {
    const pathSep = isWindows ? ";" : ":";

    console.log("📦 Extracting installed Python packages...");
    const { stdout: pipFreezeOutput } = await execAsync("uv pip freeze", { cwd: apiDir });

    const packageNames = pipFreezeOutput
      .split("\n")
      .filter((line) => line.trim() && !line.startsWith("#"))
      .map((line) => {
        const match = line.match(/^([a-zA-Z0-9_-]+)(==|>=|<=|~=|!=|===|\[.*\])?/);
        return match ? match[1].toLowerCase() : null;
      })
      .filter(Boolean)

      .filter(
        (pkg) =>
          !["pip", "setuptools", "wheel", "pyinstaller", "pyinstaller-hooks-contrib"].includes(pkg)
      );

    console.log(
      `📦 Detected ${packageNames.length} Python dependencies: ${packageNames.join(", ")}`
    );

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

    for (const pkg of packageNames) {
      pyiArgs.push("--collect-submodules");
      pyiArgs.push(pkg);
    }

    const exclusions = {
      common: [
        // Test modules
        "*.tests",
        "*.tests.*",
        "*._tests",
        "*._tests.*",
        "*.testing",
        "*.testing.*",
        // Documentation
        "*.docs",
        "*.docs.*",
        "*.sphinxext",
        "*.sphinxext.*",
        // Examples
        "*.examples",
        "*.examples.*",
        "*.sample",
        "*.sample.*",
        // Development tools
        "*.__main__",
        "*.__pycache__",
        "*.debug",
        "*.debug.*",
        // Specific large packages with many unnecessary components
        "pygments.lexers.*",
        "pygments.styles.*",
        "rich.diagnose",
        "rich.traceback",
        // Unused protocols and backends
        "uvicorn.workers",
      ],
      platforms: {
        win32: ["win32*", "winreg", "msvcrt", "winsound", "_winapi"],
        darwin: ["macholib*", "AppKit", "Carbon", "CoreFoundation", "objc"],
        linux: ["systemd", "apt_pkg"],
      },
      asyncio: {
        win32: ["asyncio.unix_*"],
        unix: ["asyncio.windows_*"],
      },
    };

    const commonExclusionsCount = exclusions.common.length;
    const platformExclusionsCount = Object.values(exclusions.platforms).reduce(
      (total, patterns) => total + patterns.length,
      0
    );
    const asyncioExclusionsCount = exclusions.asyncio.win32.length + exclusions.asyncio.unix.length;
    const totalExclusionsCount =
      commonExclusionsCount + platformExclusionsCount + asyncioExclusionsCount;

    console.log("\n📊 DEPENDENCY ANALYSIS");
    console.log(` Detected ${packageNames.length} Python dependencies: ${packageNames.join(", ")}`);
    console.log(`🔍 Adding ${commonExclusionsCount} common exclusion patterns`);
    console.log(`🔍 Total exclusion patterns: ${totalExclusionsCount}`);
    console.log(`🔍 Platform-specific exclusions available: ${platformExclusionsCount}`);
    console.log(`🔍 Asyncio-specific exclusions: ${asyncioExclusionsCount}`);
    for (const pattern of exclusions.common) {
      pyiArgs.push("--exclude-module");
      pyiArgs.push(pattern);
    }

    const allPlatforms = Object.keys(exclusions.platforms);
    let excludedPlatformModulesCount = 0;

    for (const platform of allPlatforms) {
      if (process.platform !== platform) {
        const platformModulesCount = exclusions.platforms[platform].length;
        excludedPlatformModulesCount += platformModulesCount;
        console.log(`🔍 Excluding ${platformModulesCount} ${platform}-specific modules`);
        for (const mod of exclusions.platforms[platform]) {
          pyiArgs.push("--exclude-module");
          pyiArgs.push(mod);
        }
      }
    }

    if (process.platform === "win32") {
      console.log(`🔍 Excluding ${exclusions.asyncio.win32.length} asyncio Unix-specific modules`);
      for (const mod of exclusions.asyncio.win32) {
        pyiArgs.push("--exclude-module");
        pyiArgs.push(mod);
      }
    } else {
      console.log(
        `🔍 Excluding ${exclusions.asyncio.unix.length} asyncio Windows-specific modules`
      );
      for (const mod of exclusions.asyncio.unix) {
        pyiArgs.push("--exclude-module");
        pyiArgs.push(mod);
      }
    }

    const actualExclusionsCount =
      commonExclusionsCount +
      excludedPlatformModulesCount +
      (process.platform === "win32"
        ? exclusions.asyncio.win32.length
        : exclusions.asyncio.unix.length);
    console.log(`🔍 Total exclusions applied: ${actualExclusionsCount}`);
    console.log(
      `🔍 Dependency collection ratio: ${packageNames.length} collected vs ${actualExclusionsCount} excluded`
    );
    console.log("\n📊 END DEPENDENCY ANALYSIS\n");

    pyiArgs.push("run.py");

    await spawnAsync(venvPython, pyiArgs, { cwd: apiDir });
    await updateSpecCache();
  }

  await spawnAsync(venvPython, ["-m", "PyInstaller", "api.spec", "--noconfirm"], {
    cwd: apiDir,
  });

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
