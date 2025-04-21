/**
 * Logger module for the Electron renderer process.
 * This module provides a standardized way to log messages and display logs from all sources.
 */

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

// Log level colors
const LOG_COLORS = {
  [LogLevel.DEBUG]: '#6c757d',    // Gray
  [LogLevel.INFO]: '#0d6efd',     // Blue
  [LogLevel.WARNING]: '#ffc107',  // Yellow
  [LogLevel.ERROR]: '#dc3545',    // Red
};

// Source colors
const SOURCE_COLORS = {
  [LogSource.MAIN]: '#6610f2',    // Purple
  [LogSource.RENDERER]: '#fd7e14', // Orange
  [LogSource.PYTHON]: '#20c997',  // Teal
};

/**
 * Add a log entry to the in-memory log store
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
  
  // Update the UI if the log container exists
  updateLogUI();
}

/**
 * Log a debug message
 * @param message The message to log
 * @param data Additional data to include in the log
 */
export function debug(message: string, data?: any): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.DEBUG,
    source: LogSource.RENDERER,
    message,
    data,
  };
  
  // Add to local logs
  addLogEntry(entry);
  
  // Send to main process
  window.api.log(LogLevel.DEBUG, message, data);
}

/**
 * Log an info message
 * @param message The message to log
 * @param data Additional data to include in the log
 */
export function info(message: string, data?: any): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    source: LogSource.RENDERER,
    message,
    data,
  };
  
  // Add to local logs
  addLogEntry(entry);
  
  // Send to main process
  window.api.log(LogLevel.INFO, message, data);
}

/**
 * Log a warning message
 * @param message The message to log
 * @param data Additional data to include in the log
 */
export function warning(message: string, data?: any): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.WARNING,
    source: LogSource.RENDERER,
    message,
    data,
  };
  
  // Add to local logs
  addLogEntry(entry);
  
  // Send to main process
  window.api.log(LogLevel.WARNING, message, data);
}

/**
 * Log an error message
 * @param message The message to log
 * @param error Optional error object
 * @param data Additional data to include in the log
 */
export function error(message: string, error?: Error, data?: any): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.ERROR,
    source: LogSource.RENDERER,
    message,
    data,
    exception: error ? `${error.name}: ${error.message}\n${error.stack}` : undefined,
  };
  
  // Add to local logs
  addLogEntry(entry);
  
  // Send to main process
  window.api.log(LogLevel.ERROR, message, data);
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
  
  // Clear logs in main process
  window.api.clearLogs();
  
  // Update the UI
  updateLogUI();
}

/**
 * Format a log entry for display
 * @param entry The log entry to format
 * @returns HTML string for the log entry
 */
export function formatLogEntry(entry: LogEntry): string {
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const levelColor = LOG_COLORS[entry.level] || '#000';
  const sourceColor = SOURCE_COLORS[entry.source] || '#000';
  
  let html = `
    <div class="log-entry log-level-${entry.level} log-source-${entry.source}">
      <span class="log-timestamp">${timestamp}</span>
      <span class="log-level" style="color: ${levelColor}">${entry.level.toUpperCase()}</span>
      <span class="log-source" style="color: ${sourceColor}">${entry.source}</span>
      <span class="log-message">${escapeHtml(entry.message)}</span>
  `;
  
  if (entry.data) {
    try {
      const dataStr = typeof entry.data === 'object' 
        ? JSON.stringify(entry.data, null, 2)
        : String(entry.data);
      html += `<pre class="log-data">${escapeHtml(dataStr)}</pre>`;
    } catch (e) {
      html += `<pre class="log-data">Unable to stringify data: ${e}</pre>`;
    }
  }
  
  if (entry.exception) {
    html += `<pre class="log-exception">${escapeHtml(entry.exception)}</pre>`;
  }
  
  html += '</div>';
  return html;
}

/**
 * Escape HTML special characters
 * @param text The text to escape
 * @returns Escaped HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Update the log UI with the current logs
 */
export function updateLogUI(): void {
  const logContainer = document.getElementById('log-container');
  if (!logContainer) return;
  
  // Get the scroll position
  const isScrolledToBottom = 
    logContainer.scrollHeight - logContainer.clientHeight <= logContainer.scrollTop + 1;
  
  // Update the log container
  logContainer.innerHTML = logs.map(formatLogEntry).join('');
  
  // Scroll to bottom if it was at the bottom before
  if (isScrolledToBottom) {
    logContainer.scrollTop = logContainer.scrollHeight;
  }
}

/**
 * Initialize the logger
 */
export function initLogger(): void {
  // Listen for log entries from the main process
  window.api.onLogEntry((entry: LogEntry) => {
    // Only add if it's not from the renderer (to avoid duplicates)
    if (entry.source !== LogSource.RENDERER) {
      addLogEntry(entry);
    }
  });
  
  // Get initial logs from main process
  window.api.getLogs().then((mainLogs: LogEntry[]) => {
    // Add all logs that aren't from the renderer
    mainLogs.filter(log => log.source !== LogSource.RENDERER).forEach(addLogEntry);
  });
  
  // Log that the logger is initialized
  info('Renderer logger initialized');
}

// Export the logger as a default object
export default {
  debug,
  info,
  warning,
  error,
  addLogEntry,
  getLogs,
  clearLogs,
  formatLogEntry,
  updateLogUI,
  initLogger,
  LogLevel,
  LogSource,
};
