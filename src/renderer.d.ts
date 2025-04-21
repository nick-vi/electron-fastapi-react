/**
 * TypeScript declarations for the renderer process.
 */

import { LogLevel, LogSource, LogEntry } from './main-logger';

declare global {
  interface Window {
    api: {
      /**
       * Fetch data from the FastAPI endpoint
       */
      fetchData: () => Promise<any>;
      
      /**
       * Fetch logs from the FastAPI endpoint
       */
      fetchLogs: () => Promise<any>;
      
      /**
       * Log a message to the main process
       */
      log: (level: LogLevel, message: string, data?: any) => void;
      
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
  }
}
