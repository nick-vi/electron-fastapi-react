/**
 * Main process for the Electron application.
 * This is the entry point for the Electron application.
 */

import { isDevelopment } from "@common/utils";
import logger from "@main/logger";
import { getFreePort } from "@main/network";
import { ChildProcess, spawn } from "child_process";
import { app, BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
import fetch from "node-fetch";
import * as path from "path";
import * as readline from "readline";
import { fileURLToPath } from "url";

declare global {
  var mainWindow: BrowserWindow | null;
}

if (process.platform === "win32") {
  app.setAppUserModelId(app.name);
}

let apiProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;
let apiPort: number | null = null;

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

/**
 * Start the FastAPI sidecar process
 */
const startApiSidecar = async (): Promise<void> => {
  try {
    apiPort = await getFreePort();
    if (!apiPort) {
      throw new Error("Failed to get a free port");
    }
    logger.debug(`Using port ${apiPort} for API server`);

    const appPath = app.getAppPath();

    if (isDevelopment()) {
      const pythonScript = path.join(appPath, "api", "run.py");

      if (!fs.existsSync(pythonScript)) {
        logger.error(`Python script not found at: ${pythonScript}`);
        throw new Error(`Python script not found at: ${pythonScript}`);
      }

      const uvCommand = process.platform === "win32" ? "uv" : "uv";
      const apiDir = path.join(appPath, "api");

      apiProcess = spawn(
        uvCommand,
        [
          "run",
          pythonScript,
          "--app-path",
          appPath,
          "--port",
          apiPort.toString(),
          "--reload",
          "--log-level",
          "debug",
        ],
        {
          cwd: apiDir,
          env: {
            ...process.env,
            PYTHONPATH: apiDir,
            // App path is passed as a command-line argument, not as an environment variable
          },
        }
      );
    } else {
      const resourcesPath = process.resourcesPath;
      logger.info(`Resources path: ${resourcesPath}`);

      const apiDir = path.join(resourcesPath, "api");
      logger.info(`Using production API directory: ${apiDir}`);

      if (!fs.existsSync(apiDir)) {
        logger.error(`API directory not found at: ${apiDir}`);
        throw new Error(`API directory not found at: ${apiDir}`);
      }

      const binaryName = process.platform === "win32" ? "api.exe" : "api";
      const binaryPath = path.join(apiDir, binaryName);

      if (!fs.existsSync(binaryPath)) {
        logger.error(`API binary not found at: ${binaryPath}`);
        throw new Error(`API binary not found at: ${binaryPath}`);
      }

      logger.info(`Running binary: ${binaryPath} with app path: ${appPath} and port: ${apiPort}`);

      if (process.platform !== "win32") {
        try {
          fs.chmodSync(binaryPath, 0o755);
        } catch (error) {
          logger.warning(`Failed to set executable permissions on ${binaryPath}: ${error}`);
        }
      }

      apiProcess = spawn(binaryPath, ["--app-path", appPath, "--port", apiPort.toString()], {
        cwd: apiDir,
        env: {
          ...process.env,
          // App path is passed as a command-line argument, not as an environment variable
        },
      });
    }

    setupApiProcessHandlers();
  } catch (error) {
    logger.error("Failed to start API sidecar", error as Error);
    throw error;
  }
};

/**
 * Set up handlers for the API process
 */
const setupApiProcessHandlers = (): void => {
  if (!apiProcess) return;

  const stdoutReader = readline.createInterface({
    input: apiProcess.stdout!,
    terminal: false,
  });

  const stderrReader = readline.createInterface({
    input: apiProcess.stderr!,
    terminal: false,
  });

  stdoutReader.on("line", (line) => {
    if (!logger.parsePythonLog(line)) {
      logger.info(`API: ${line}`);
    }
  });

  stderrReader.on("line", (line) => {
    if (!logger.parsePythonLog(line)) {
      logger.error(`API Error: ${line}`);
    }
  });

  apiProcess.on("close", (code) => {
    logger.info(`API process exited with code ${code}`);
    apiProcess = null;

    if (mainWindow) {
      mainWindow.webContents.send("api-process-exited", code);
    }
  });

  apiProcess.on("error", (err) => {
    logger.error("API process error", err);
  });

  const checkApiHealth = async (): Promise<void> => {
    try {
      if (!apiPort) {
        throw new Error("API port not set");
      }
      const response = await fetch(`http://127.0.0.1:${apiPort}/health`);
      if (response.ok) {
        logger.info("API is ready");
        if (mainWindow) {
          mainWindow.webContents.send("api-ready", apiPort);
        }
        return;
      }
    } catch {
      global.setTimeout(() => void checkApiHealth(), 500);
    }
  };

  global.setTimeout(() => void checkApiHealth(), 1000);
};

/**
 * Create the main application window
 */
const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: isDevelopment()
        ? path.join(process.cwd(), "dist-electron/preload/index.js")
        : path.join(currentDirPath, "../preload/index.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  global.mainWindow = mainWindow;

  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL);
  } else {
    mainWindow.loadFile(path.join(currentDirPath, "../renderer/index.html"));
  }

  // Uncomment the following lines if you need to debug the main process on startup
  // if (isDevelopment()) {
  //   mainWindow.webContents.openDevTools();
  // }

  logger.info("Main window created");

  mainWindow.on("closed", () => {
    logger.info("Main window closed");
    mainWindow = null;
    global.mainWindow = null;
  });
};

/**
 * Stop the FastAPI sidecar process
 */
const stopApiSidecar = (): void => {
  if (apiProcess) {
    logger.info("Stopping API sidecar process");
    apiProcess.kill();
    apiProcess = null;
    apiPort = null;
  } else {
    logger.info("No API sidecar process to stop");
  }
};

/**
 * Restart the FastAPI sidecar process
 */
const restartApiSidecar = async (): Promise<void> => {
  logger.info("Restarting API sidecar process");
  stopApiSidecar();
  await startApiSidecar();
};

/**
 * Set up IPC handlers
 */
const setupIPC = (): void => {
  logger.setupLoggerIPC();

  ipcMain.handle("start-api-sidecar", async () => {
    logger.info("Starting API sidecar from renderer request");
    await startApiSidecar();
    return apiPort;
  });

  ipcMain.handle("stop-api-sidecar", () => {
    logger.info("Stopping API sidecar from renderer request");
    stopApiSidecar();
    return true;
  });

  ipcMain.handle("restart-api-sidecar", async () => {
    logger.info("Restarting API sidecar from renderer request");
    await restartApiSidecar();
    return apiPort;
  });

  ipcMain.handle("get-api-port", () => {
    return apiPort;
  });
};

app.whenReady().then(() => {
  logger.info("Application starting", {
    version: app.getVersion(),
    platform: process.platform,
  });

  setupIPC();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      logger.info("Recreating window via activate event");
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  logger.info("All windows closed");
  if (process.platform !== "darwin") {
    logger.info("Quitting application");
    app.quit();
  }
});

app.on("will-quit", () => {
  logger.info("Application will quit");
  if (apiProcess) {
    logger.info("Killing API process");
    apiProcess.kill();
    apiProcess = null;
  }
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception in main process", error);
});

process.on("unhandledRejection", (reason) => {
  logger.error(`Unhandled promise rejection: ${reason}`);
});

app.on("quit", () => {
  logger.info("Application quit");
});
