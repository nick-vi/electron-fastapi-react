/**
 * Type definitions for the renderer process API.
 */

import type { LogEntry, LogLevel } from "./logger-types";

// Define the API type
export type ElectronAPI = {
  /**
   * Fetch data from the FastAPI endpoint
   */
  fetchData: () => Promise<unknown>;

  /**
   * Fetch logs from the FastAPI endpoint
   */
  fetchLogs: () => Promise<unknown>;

  /**
   * Log a message to the main process
   */
  log: (level: LogLevel, message: string, data?: unknown) => void;

  /**
   * Get logs from the main process
   */
  getLogs: () => Promise<LogEntry[]>;

  /**
   * Clear logs
   */
  clearLogs: () => Promise<void>;

  /**
   * Listen for log entries from the main process
   */
  onLogEntry: (callback: (entry: LogEntry) => void) => void;
};

declare global {
  // Extend the Window interface
  interface Window {
    api: ElectronAPI;
  }
}
