/**
 * Type definitions for the renderer process API.
 */

import type { LogEntry, LogLevel } from "./logger-types";

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
  onLogEntry: (callback: (entry: LogEntry) => void) => () => void;

  /**
   * Start the API sidecar process
   */
  startApiSidecar: () => Promise<number>;

  /**
   * Stop the API sidecar process
   */
  stopApiSidecar: () => Promise<boolean>;

  /**
   * Restart the API sidecar process
   */
  restartApiSidecar: () => Promise<number>;

  /**
   * Check if the API is ready
   */
  checkApiReady: () => Promise<boolean>;

  /**
   * Listen for API ready events
   */
  onApiReady: (callback: (port: number) => void) => () => void;

  /**
   * Listen for API process exit events
   */
  onApiProcessExit: (callback: (exitCode: number) => void) => () => void;
};

declare global {
  interface Window {
    api: ElectronAPI;
    /**
     * Whether the app is running on a mobile device
     */
    isMobileState: boolean;
  }
}
