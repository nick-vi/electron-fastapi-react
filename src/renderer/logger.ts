/**
 * Logger module for the Electron renderer process.
 * This module provides a standardized way to log messages and display logs from all sources.
 */

import { LOG_COLORS, LogEntry, LogLevel, LogSource, SOURCE_COLORS } from "@common/logger-types";
import "@common/renderer-api";

const logs: LogEntry[] = [];
const MAX_LOGS = 1000;

/**
 * Add a log entry to the in-memory log store
 * @param entry The log entry to add
 */
export function addLogEntry(entry: LogEntry): void {
  if (!entry.timestamp) {
    entry.timestamp = new Date().toISOString();
  }

  logs.push(entry);

  if (logs.length > MAX_LOGS) {
    logs.shift();
  }

  const consoleMessage = `[${
    entry.timestamp
  }] [${entry.level.toUpperCase()}] [${entry.source}] ${entry.message}`;

  switch (entry.level) {
    case LogLevel.DEBUG:
      console.debug(consoleMessage, entry.data || "");
      break;
    case LogLevel.INFO:
      console.info(consoleMessage, entry.data || "");
      break;
    case LogLevel.WARNING:
      console.warn(consoleMessage, entry.data || "");
      break;
    case LogLevel.ERROR:
      console.error(consoleMessage, entry.data || "");
      if (entry.exception) {
        console.error(entry.exception);
      }
      break;
    default:
      console.log(consoleMessage, entry.data || "");
  }

  updateLogUI();
}

/**
 * Log a debug message
 * @param message The message to log
 * @param data Additional data to include in the log
 */
export function debug(message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.DEBUG,
    source: LogSource.RENDERER,
    message,
    data,
  };

  addLogEntry(entry);

  window.api.log(LogLevel.DEBUG, message, data);
}

/**
 * Log an info message
 * @param message The message to log
 * @param data Additional data to include in the log
 */
export function info(message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.INFO,
    source: LogSource.RENDERER,
    message,
    data,
  };

  addLogEntry(entry);

  window.api.log(LogLevel.INFO, message, data);
}

/**
 * Log a warning message
 * @param message The message to log
 * @param data Additional data to include in the log
 */
export function warning(message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.WARNING,
    source: LogSource.RENDERER,
    message,
    data,
  };

  addLogEntry(entry);

  window.api.log(LogLevel.WARNING, message, data);
}

/**
 * Log an error message
 * @param message The message to log
 * @param error Optional error object
 * @param data Additional data to include in the log
 */
export function error(message: string, error?: Error, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level: LogLevel.ERROR,
    source: LogSource.RENDERER,
    message,
    data,
    exception: error ? `${error.name}: ${error.message}\n${error.stack}` : undefined,
  };

  addLogEntry(entry);

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
  info("Logs cleared");

  window.api.clearLogs();

  updateLogUI();
}

/**
 * Format a log entry for display
 * @param entry The log entry to format
 * @returns HTML string for the log entry
 */
export function formatLogEntry(entry: LogEntry): string {
  const timestamp = new Date(entry.timestamp).toLocaleTimeString();
  const levelColor = LOG_COLORS[entry.level] || "#000";
  const sourceColor = SOURCE_COLORS[entry.source] || "#000";

  let html = `
    <div class="log-entry log-level-${entry.level} log-source-${entry.source}">
      <span class="log-timestamp">${timestamp}</span>
      <span class="log-level" style="color: ${levelColor}">${entry.level.toUpperCase()}</span>
      <span class="log-source" style="color: ${sourceColor}">${entry.source}</span>
      <span class="log-message">${escapeHtml(entry.message)}</span>
  `;

  if (entry.data) {
    try {
      const dataStr =
        typeof entry.data === "object" ? JSON.stringify(entry.data, null, 2) : String(entry.data);
      html += `<pre class="log-data">${escapeHtml(dataStr)}</pre>`;
    } catch (e) {
      html += `<pre class="log-data">Unable to stringify data: ${e}</pre>`;
    }
  }

  if (entry.exception) {
    html += `<pre class="log-exception">${escapeHtml(entry.exception)}</pre>`;
  }

  html += "</div>";
  return html;
}

/**
 * Escape HTML special characters
 * @param text The text to escape
 * @returns Escaped HTML
 */
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Update the log UI with the current logs
 */
export function updateLogUI(): void {
  const logContainer = document.getElementById("log-container");
  if (!logContainer) return;

  const isScrolledToBottom =
    logContainer.scrollHeight - logContainer.clientHeight <= logContainer.scrollTop + 1;

  logContainer.innerHTML = logs.map(formatLogEntry).join("");

  if (isScrolledToBottom) {
    logContainer.scrollTop = logContainer.scrollHeight;
  }
}

/**
 * Initialize the logger
 */
export function initLogger(): void {
  window.api.onLogEntry((entry: LogEntry) => {
    if (entry.source !== LogSource.RENDERER) {
      addLogEntry(entry);
    }
  });

  window.api.getLogs().then((mainLogs: LogEntry[]) => {
    mainLogs.filter((log) => log.source !== LogSource.RENDERER).forEach(addLogEntry);
  });

  info("Renderer logger initialized");
}

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
