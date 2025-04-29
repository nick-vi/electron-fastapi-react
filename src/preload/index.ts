/**
 * Preload script for the Electron renderer process.
 * This script runs in the renderer process before the web page is loaded.
 * It has access to both Node.js and browser APIs.
 */

import type { LogEntry } from "@common/logger-types";
import type { ElectronAPI } from "@common/renderer-api";
import { contextBridge, ipcRenderer } from "electron";

let apiPort: number | null = null;

/**
 * Expose a limited API to the renderer process
 */
contextBridge.exposeInMainWorld("api", {
  /**
   * Fetch data from the FastAPI endpoint
   */
  fetchData: async (): Promise<unknown> => {
    try {
      if (!apiPort) {
        throw new Error("API port not set");
      }
      const response = await fetch(`http://127.0.0.1:${apiPort}/`);
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
      if (!apiPort) {
        throw new Error("API port not set");
      }
      const response = await fetch(`http://127.0.0.1:${apiPort}/logs`);
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
  startApiSidecar: async (): Promise<number> => {
    const port = await ipcRenderer.invoke("start-api-sidecar");
    if (port === null) {
      throw new Error("Failed to start API sidecar: port is null");
    }
    apiPort = port;
    return port;
  },

  /**
   * Stop the API sidecar process
   */
  stopApiSidecar: async (): Promise<boolean> => {
    const result = await ipcRenderer.invoke("stop-api-sidecar");
    apiPort = null;
    return result;
  },

  /**
   * Restart the API sidecar process
   */
  restartApiSidecar: async (): Promise<number> => {
    const port = await ipcRenderer.invoke("restart-api-sidecar");
    if (port === null) {
      throw new Error("Failed to restart API sidecar: port is null");
    }
    apiPort = port;
    return port;
  },

  /**
   * Check if the API is ready by calling the health endpoint
   */
  checkApiReady: async (): Promise<boolean> => {
    try {
      // Get the latest port from the main process
      const latestPort = await ipcRenderer.invoke("get-api-port");

      // Update our local port if it's different
      if (latestPort !== null && latestPort !== apiPort) {
        apiPort = latestPort;
      }

      if (!apiPort) {
        // No port means the API is definitely not running
        return false;
      }

      try {
        const response = await fetch(`http://127.0.0.1:${apiPort}/health`, {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(500), // Timeout after 500ms
        });
        return response.ok;
      } catch (fetchError) {
        // Connection errors mean the API is not running
        return false;
      }
    } catch (error) {
      // This would be an error with the IPC call, not the API itself
      console.error("Error checking API readiness:", error);
      return false;
    }
  },

  /**
   * Listen for API ready event from main process
   */
  onApiReady: (callback: (port: number) => void) => {
    const listener = (_event: unknown, port: number) => {
      apiPort = port;
      callback(port);
    };
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

  /**
   * Get the API port from the main process
   */
  getApiPort: async (): Promise<number | null> => {
    // Get the latest port from the main process
    const port = await ipcRenderer.invoke("get-api-port");

    // Update our local port if it's different
    if (port !== null && port !== apiPort) {
      apiPort = port;
    }

    return apiPort;
  },
});
