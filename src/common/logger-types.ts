/**
 * Shared logger types and constants for both main and renderer processes.
 */

export const LogLevel = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
} as const;

export type LogLevel = (typeof LogLevel)[keyof typeof LogLevel];

export const LogSource = {
  MAIN: "main",
  RENDERER: "renderer",
  PYTHON: "python",
} as const;

export type LogSource = (typeof LogSource)[keyof typeof LogSource];

export type LogEntry = {
  timestamp: string; // Always set by addLogEntry if not provided
  level: LogLevel;
  source: LogSource;
  message: string;
  data?: unknown;
  exception?: string;
};

export const LOG_COLORS = {
  [LogLevel.DEBUG]: "#6c757d",
  [LogLevel.INFO]: "#0d6efd",
  [LogLevel.WARNING]: "#ffc107",
  [LogLevel.ERROR]: "#dc3545",
};

export const SOURCE_COLORS = {
  [LogSource.MAIN]: "#6610f2",
  [LogSource.RENDERER]: "#fd7e14",
  [LogSource.PYTHON]: "#20c997",
};
