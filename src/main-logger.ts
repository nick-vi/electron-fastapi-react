/**
 * Logger module for the Electron main process.
 * This module provides a standardized way to log messages and capture logs from the FastAPI process.
 */

import { ipcMain } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Define log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
}

// Define log sources
export enum LogSource {
  MAIN = 'main',
  RENDERER = 'renderer',
  PYTHON = 'python',
}

// Define log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  data?: any;
  exception?: string;
}

// Store logs in memory
const logs: LogEntry[] = [];
const MAX_LOGS = 1000; // Maximum number of logs to keep in memory

// Get the __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Log file path
const LOG_FILE_PATH = path.join(__dirname, '../logs/electron-fastapi.log');

// Ensure log directory exists
try {
  const logDir = path.dirname(LOG_FILE_PATH);
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (error) {
  console.error('Failed to create log directory:', error);
}

/**
 * Add a log entry to the in-memory log store and optionally write to file
 * @param entry The log entry to add
 */
export function addLogEntry(entry: LogEntry): void {
  // Add timestamp if not provided
  if (!entry.timestamp) {
    entry.timestamp = new Date().toISOString();
  }
  
  // Add to in-memory logs
  logs.push(entry);
  
  // Trim logs if they exceed the maximum
  if (logs.length > MAX_LOGS) {
    logs.shift(); // Remove the oldest log
  }
  
  // Format log for console
  const consoleMessage = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`;
  
  // Log to console based on level
  switch (entry.level) {
    case LogLevel.DEBUG:
      console.debug(consoleMessage, entry.data || '');
      break;
    case LogLevel.INFO:
      console.info(consoleMessage, entry.data || '');
      break;
    case LogLevel.WARNING:
      console.warn(consoleMessage, entry.data || '');
      break;
    case LogLevel.ERROR:
      console.error(consoleMessage, entry.data || '');
      if (entry.exception) {
        console.error(entry.exception);
      }
      break;
    default:
      console.log(consoleMessage, entry.data || '');
  }
  
  // Write to file
  try {
    const logLine = JSON.stringify(entry) + '\n';
    fs.appendFileSync(LOG_FILE_PATH, logLine);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
  
  // Notify renderer process of new log
  try {
    const mainWindow = global.mainWindow;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('log-entry', entry);
    }
  } catch (error) {
    console.error('Failed to send log to renderer:', error);
  }
}

/**
 * Log a debug message
 * @param message The message to log
 * @param data Additional data to include in the log
 */
export function debug(message: string, data?: any): void {
  addLogEntry({
    timestamp: new Date().toISOString(),
    level: LogLevel.DEBUG,
    source: LogSource.MAIN,
    message,
    data,
  });
}

/**
 * Log an info message
 * @param message The message to log
 * @param data Additional data to include in the log
 */
export function info(message: string, data?: any): void {
  addLogEntry({
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    source: LogSource.MAIN,
    message,
    data,
  });
}

/**
 * Log a warning message
 * @param message The message to log
 * @param data Additional data to include in the log
 */
export function warning(message: string, data?: any): void {
  addLogEntry({
    timestamp: new Date().toISOString(),
    level: LogLevel.WARNING,
    source: LogSource.MAIN,
    message,
    data,
  });
}

/**
 * Log an error message
 * @param message The message to log
 * @param error Optional error object
 * @param data Additional data to include in the log
 */
export function error(message: string, error?: Error, data?: any): void {
  addLogEntry({
    timestamp: new Date().toISOString(),
    level: LogLevel.ERROR,
    source: LogSource.MAIN,
    message,
    data,
    exception: error ? `${error.name}: ${error.message}\n${error.stack}` : undefined,
  });
}

/**
 * Parse a log line from the Python process
 * @param line The log line to parse
 * @returns True if the line was parsed as a log, false otherwise
 */
export function parsePythonLog(line: string): boolean {
  // Check if this is a JSON log from our custom logger
  if (line.startsWith('ELECTRON_LOG_JSON:')) {
    try {
      const jsonStr = line.substring('ELECTRON_LOG_JSON:'.length);
      const logData = JSON.parse(jsonStr);
      
      // Create a log entry from the parsed data
      const entry: LogEntry = {
        timestamp: logData.timestamp || new Date().toISOString(),
        level: (logData.level || 'info').toLowerCase() as LogLevel,
        source: LogSource.PYTHON,
        message: logData.message || '',
        data: logData.data,
        exception: logData.exception,
      };
      
      // Add the log entry
      addLogEntry(entry);
      return true;
    } catch (err) {
      error('Failed to parse Python log JSON', err as Error);
      return false;
    }
  }
  
  // If not a JSON log, treat as a regular log line
  if (line.trim()) {
    addLogEntry({
      timestamp: new Date().toISOString(),
      level: LogLevel.INFO,
      source: LogSource.PYTHON,
      message: line.trim(),
    });
    return true;
  }
  
  return false;
}

/**
 * Get all logs
 * @returns Array of log entries
 */
export function getLogs(): LogEntry[] {
  return [...logs];
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
  logs.length = 0;
  info('Logs cleared');
}

/**
 * Set up IPC handlers for logging
 */
export function setupLoggerIPC(): void {
  // Handle log messages from renderer
  ipcMain.handle('log', (event, level: LogLevel, message: string, data?: any) => {
    addLogEntry({
      timestamp: new Date().toISOString(),
      level,
      source: LogSource.RENDERER,
      message,
      data,
    });
  });
  
  // Handle requests for logs
  ipcMain.handle('get-logs', () => {
    return getLogs();
  });
  
  // Handle requests to clear logs
  ipcMain.handle('clear-logs', () => {
    clearLogs();
  });
}

// Export the logger as a default object
export default {
  debug,
  info,
  warning,
  error,
  addLogEntry,
  parsePythonLog,
  getLogs,
  clearLogs,
  setupLoggerIPC,
  LogLevel,
  LogSource,
};
