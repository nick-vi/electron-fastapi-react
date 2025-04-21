import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs';
import * as readline from 'readline';

// Import our custom logger
import logger, { LogLevel, LogSource } from './main-logger';

// Make mainWindow accessible globally for the logger
declare global {
  var mainWindow: BrowserWindow | null;
}

// Get the __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (process.platform === 'win32') {
  app.setAppUserModelId(app.name);
}

// Reference to the FastAPI sidecar process
let apiProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

// Path to the FastAPI executable
const getApiPath = (): string => {
  const appPath = app.getAppPath();

  // Determine the path based on the platform
  if (process.platform === 'win32') {
    return path.join(appPath, 'api', 'dist', 'api', 'api.exe');
  } else {
    return path.join(appPath, 'api', 'dist', 'api', 'api');
  }
};

// Start the FastAPI sidecar
const startApiSidecar = (): void => {
  const apiPath = getApiPath();
  const appPath = app.getAppPath();

  // Check if the API executable exists
  if (!fs.existsSync(apiPath)) {
    logger.error(`API executable not found at: ${apiPath}`);

    // Try to run the Python script directly if the executable doesn't exist
    const pythonScript = path.join(appPath, 'api', 'run.py');
    if (fs.existsSync(pythonScript)) {
      logger.info(`Trying to run Python script directly: ${pythonScript}`);

      // Find Python executable
      const pythonExe = process.platform === 'win32' ? 'python' : 'python3';

      // Start the Python process
      apiProcess = spawn(pythonExe, [pythonScript, appPath]);
      setupApiProcessHandlers();
      return;
    }

    logger.error('Could not find API executable or Python script');
    return;
  }

  logger.info(`Starting API sidecar at: ${apiPath}`);
  logger.info(`With app path: ${appPath}`);

  // Pass the app path as an argument to the FastAPI sidecar
  apiProcess = spawn(apiPath, [appPath]);
  setupApiProcessHandlers();
};

// Set up handlers for the API process
const setupApiProcessHandlers = (): void => {
  if (!apiProcess) return;

  // Create readline interfaces for stdout and stderr
  const stdoutReader = readline.createInterface({
    input: apiProcess.stdout!,
    terminal: false,
  });

  const stderrReader = readline.createInterface({
    input: apiProcess.stderr!,
    terminal: false,
  });

  // Handle stdout line by line
  stdoutReader.on('line', (line) => {
    // Try to parse as a log message
    if (!logger.parsePythonLog(line)) {
      // If not a structured log, log as regular info
      logger.info(`API: ${line}`);
    }
  });

  // Handle stderr line by line
  stderrReader.on('line', (line) => {
    // Try to parse as a log message
    if (!logger.parsePythonLog(line)) {
      // If not a structured log, log as error
      logger.error(`API Error: ${line}`);
    }
  });

  // Handle process exit
  apiProcess.on('close', (code) => {
    logger.info(`API process exited with code ${code}`);
    apiProcess = null;
  });

  // Handle process error
  apiProcess.on('error', (err) => {
    logger.error('API process error', err);
  });
};

const createWindow = (): void => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Make mainWindow globally accessible for the logger
  global.mainWindow = mainWindow;

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  // Open the DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  // Log window creation
  logger.info('Main window created');

  // Handle window closed event
  mainWindow.on('closed', () => {
    logger.info('Main window closed');
    mainWindow = null;
    global.mainWindow = null;
  });
};

// Set up IPC handlers for logging
const setupIPC = (): void => {
  // Set up logger IPC handlers
  logger.setupLoggerIPC();

  // Add any other IPC handlers here
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Initialize logger
  logger.info('Application starting', {
    version: app.getVersion(),
    platform: process.platform,
  });

  // Set up IPC handlers
  setupIPC();

  // Start the FastAPI sidecar
  startApiSidecar();

  // Create the main window
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      logger.info('Recreating window via activate event');
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  logger.info('All windows closed');
  if (process.platform !== 'darwin') {
    logger.info('Quitting application');
    app.quit();
  }
});

// Kill the API process when the app is about to quit
app.on('will-quit', () => {
  logger.info('Application will quit');
  if (apiProcess) {
    logger.info('Killing API process');
    apiProcess.kill();
    apiProcess = null;
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception in main process', error);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error(`Unhandled promise rejection: ${reason}`);
});

// Log application quit
app.on('quit', () => {
  logger.info('Application quit');
});
