/**
 * Preload script for the Electron renderer process.
 * This script runs in the renderer process before the web page is loaded.
 * It has access to both Node.js and browser APIs.
 */

import type { LogEntry } from "@common/logger-types";
import type { ElectronAPI } from "@common/renderer-api";
import { contextBridge, ipcRenderer } from "electron";

/**
 * Expose a limited API to the renderer process
 */
contextBridge.exposeInMainWorld("api", {
  /**
   * Fetch data from the FastAPI endpoint
   */
  fetchData: async (): Promise<unknown> => {
    try {
      const response = await fetch("http://127.0.0.1:8000/");
      return await response.json();
    } catch (error) {
      console.error("Error fetching data:", error);
      return { error: "Failed to fetch data from API" };
    }
  },

  /**
   * Fetch logs from the FastAPI endpoint
   */
  fetchLogs: async (): Promise<unknown> => {
    try {
      const response = await fetch("http://127.0.0.1:8000/logs");
      return await response.json();
    } catch (error) {
      console.error("Error fetching logs:", error);
      return { error: "Failed to fetch logs from API" };
    }
  },

  /**
   * Log a message to the main process
   */
  log: (
    level: ElectronAPI["log"] extends (level: infer L, ...args: unknown[]) => unknown ? L : never,
    message: string,
    data?: unknown
  ) => {
    ipcRenderer.invoke("log", level, message, data);
  },

  /**
   * Get logs from main process
   */
  getLogs: async (): Promise<LogEntry[]> => {
    return await ipcRenderer.invoke("get-logs");
  },

  /**
   * Clear logs
   */
  clearLogs: async (): Promise<void> => {
    await ipcRenderer.invoke("clear-logs");
  },

  /**
   * Listen for log entries
   */
  onLogEntry: (callback: (entry: LogEntry) => void) => {
    const listener = (_event: unknown, entry: LogEntry) => callback(entry);
    ipcRenderer.on("log-entry", listener);
    return () => {
      ipcRenderer.removeListener("log-entry", listener);
    };
  },

  /**
   * Start the API sidecar process
   */
  startApiSidecar: async (): Promise<boolean> => {
    return await ipcRenderer.invoke("start-api-sidecar");
  },

  /**
   * Check if the API is ready by calling the health endpoint
   */
  checkApiReady: async (): Promise<boolean> => {
    try {
      const response = await fetch("http://127.0.0.1:8000/health", {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(500), // Timeout after 500ms
      });
      return response.ok;
    } catch (error) {
      console.error("Error checking API readiness:", error);
      return false;
    }
  },

  /**
   * Listen for API ready event from main process
   */
  onApiReady: (callback: () => void) => {
    const listener = () => callback();
    ipcRenderer.on("api-ready", listener);
    return () => {
      ipcRenderer.removeListener("api-ready", listener);
    };
  },

  /**
   * Listen for API process exit events
   */
  onApiProcessExit: (callback: (exitCode: number) => void) => {
    const listener = (_event: unknown, exitCode: number) => callback(exitCode);
    ipcRenderer.on("api-process-exited", listener);
    return () => {
      ipcRenderer.removeListener("api-process-exited", listener);
    };
  },
});
