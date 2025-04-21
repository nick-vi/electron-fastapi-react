/**
 * Main process for the Electron application.
 * This is the entry point for the Electron application.
 */

import { isDevelopment } from "@common/utils";
import logger from "@main/logger";
import { ChildProcess, spawn } from "child_process";
import { app, BrowserWindow, ipcMain } from "electron";
import * as fs from "fs";
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

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

/**
 * Start the FastAPI sidecar process
 */
const startApiSidecar = (): void => {
  const appPath = app.getAppPath();

  if (isDevelopment()) {
    const pythonScript = path.join(appPath, "api", "run.py");

    if (!fs.existsSync(pythonScript)) {
      logger.error(`Python script not found at: ${pythonScript}`);
      throw new Error(`Python script not found at: ${pythonScript}`);
    }

    logger.info(`Starting Python script directly: ${pythonScript}`);

    const uvCommand = process.platform === "win32" ? "uv" : "uv";
    const apiDir = path.join(appPath, "api");

    logger.info(
      `Running command: ${uvCommand} run -m uvicorn main:app --reload in directory ${apiDir}`
    );

    apiProcess = spawn(uvCommand, ["run", "-m", "uvicorn", "main:app", "--reload"], {
      cwd: apiDir,
      env: {
        ...process.env,
        PYTHONPATH: apiDir,
        ELECTRON_APP_PATH: appPath,
      },
    });
  } else {
    // In production mode, use the extraResources api directory
    const resourcesPath = process.resourcesPath;
    const apiDir = path.join(resourcesPath, "api");

    // Check if the API directory exists
    if (!fs.existsSync(apiDir)) {
      logger.error(`API directory not found at: ${apiDir}`);
      throw new Error(`API directory not found at: ${apiDir}`);
    }

    // Check if main.py exists
    const mainPyPath = path.join(apiDir, "main.py");
    if (!fs.existsSync(mainPyPath)) {
      logger.error(`main.py not found at: ${mainPyPath}`);
      throw new Error(`main.py not found at: ${mainPyPath}`);
    }

    // In production, we'll use python/python3 directly
    const pythonCommand = process.platform === "win32" ? "python" : "python3";

    logger.info(`Using production API directory: ${apiDir}`);
    logger.info(`Resources path: ${resourcesPath}`);
    logger.info(`Running command: ${pythonCommand} -m uvicorn main:app in directory ${apiDir}`);

    // Start the process
    apiProcess = spawn(pythonCommand, ["-m", "uvicorn", "main:app"], {
      cwd: apiDir, // Set the working directory to the API directory
      env: {
        ...process.env,
        PYTHONPATH: apiDir, // Make sure Python can find the modules
        ELECTRON_APP_PATH: appPath, // Pass the app path as an environment variable
      },
    });
  }

  setupApiProcessHandlers();
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

  if (process.env.NODE_ENV === "development") {
    mainWindow.webContents.openDevTools();
  }

  logger.info("Main window created");

  mainWindow.on("closed", () => {
    logger.info("Main window closed");
    mainWindow = null;
    global.mainWindow = null;
  });
};

/**
 * Set up IPC handlers
 */
const setupIPC = (): void => {
  logger.setupLoggerIPC();

  ipcMain.handle("start-api-sidecar", () => {
    logger.info("Starting API sidecar from renderer request");
    startApiSidecar();
    return true;
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
