import { contextBridge, ipcRenderer } from 'electron';
import { LogLevel, LogSource, LogEntry } from './main-logger';

// Expose a limited API to the renderer process
contextBridge.exposeInMainWorld('api', {
  // Function to fetch data from the FastAPI endpoint
  fetchData: async (): Promise<any> => {
    try {
      const response = await fetch('http://127.0.0.1:8000/');
      return await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      return { error: 'Failed to fetch data from API' };
    }
  },

  // Function to fetch logs from the FastAPI endpoint
  fetchLogs: async (): Promise<any> => {
    try {
      const response = await fetch('http://127.0.0.1:8000/logs');
      return await response.json();
    } catch (error) {
      console.error('Error fetching logs:', error);
      return { error: 'Failed to fetch logs from API' };
    }
  },

  // Logging functions
  log: (level: LogLevel, message: string, data?: any) => {
    ipcRenderer.invoke('log', level, message, data);
  },

  // Get logs from main process
  getLogs: async (): Promise<LogEntry[]> => {
    return await ipcRenderer.invoke('get-logs');
  },

  // Clear logs
  clearLogs: async (): Promise<void> => {
    await ipcRenderer.invoke('clear-logs');
  },

  // Listen for log entries
  onLogEntry: (callback: (entry: LogEntry) => void) => {
    const listener = (_event: any, entry: LogEntry) => callback(entry);
    ipcRenderer.on('log-entry', listener);
    return () => {
      ipcRenderer.removeListener('log-entry', listener);
    };
  },
});
