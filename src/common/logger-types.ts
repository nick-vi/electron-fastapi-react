/**
 * Shared logger types and constants for both main and renderer processes.
 */

export const LogLevelValues = {
  DEBUG: "debug",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
} as const;

export type LogLevel = (typeof LogLevelValues)[keyof typeof LogLevelValues];

export const LogSourceValues = {
  MAIN: "main",
  RENDERER: "renderer",
  PYTHON: "python",
} as const;

export type LogSource = (typeof LogSourceValues)[keyof typeof LogSourceValues];

export type LogEntry = {
  timestamp: string;
  level: LogLevel;
  source: LogSource;
  message: string;
  data?: unknown;
  exception?: string;
};

export const LOG_COLORS = {
  [LogLevelValues.DEBUG]: "#6c757d",
  [LogLevelValues.INFO]: "#0d6efd",
  [LogLevelValues.WARNING]: "#ffc107",
  [LogLevelValues.ERROR]: "#dc3545",
};

export const SOURCE_COLORS = {
  [LogSourceValues.MAIN]: "#6610f2",
  [LogSourceValues.RENDERER]: "#fd7e14",
  [LogSourceValues.PYTHON]: "#20c997",
};
