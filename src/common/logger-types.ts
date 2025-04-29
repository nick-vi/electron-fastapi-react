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
  UVICORN: "uvicorn",
} as const;

export type LogSource = (typeof LogSource)[keyof typeof LogSource];

export type LogEntry = {
  timestamp: string;
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
  [LogSource.UVICORN]: "#17a2b8", // Teal color for Uvicorn
};

export const isError = (log: LogLevel): boolean => log === LogLevel.ERROR;
export const isWarning = (log: LogLevel): boolean => log === LogLevel.WARNING;
export const isInfo = (log: LogLevel): boolean => log === LogLevel.INFO;
export const isDebug = (log: LogLevel): boolean => log === LogLevel.DEBUG;

export const isMain = (source: LogSource): boolean => source === LogSource.MAIN;
export const isRenderer = (source: LogSource): boolean => source === LogSource.RENDERER;
export const isPython = (source: LogSource): boolean => source === LogSource.PYTHON;
export const isUvicorn = (source: LogSource): boolean => source === LogSource.UVICORN;
