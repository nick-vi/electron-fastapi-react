"use client";

import { LogLevel, LogSource } from "@common/logger-types";
import useLocalStorage from "@renderer/hooks/useLocalStorage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

const MAX_LOG_LENGTH = 150;
const LS_KEY_MINIMIZED = "debug-console-minimized";
const LS_KEY_EXPANDED = "debug-console-expanded";
const LS_KEY_ACTIVE_FILTERS = "debug-console-active-filters";

export type ConsoleLog = {
  timestamp: number;
  message: string | object;
  status: LogLevel;
  source?: LogSource;
  data?: unknown;
};

type ConsoleContextType = {
  logs: ConsoleLog[];
  filteredLogs: ConsoleLog[];
  isMinimized: boolean;
  isExpanded: boolean;
  showFilters: boolean;
  showMenu: boolean;
  activeFilters: LogLevel[];
  serverStatus: string;
  apiPort: number | null;
  isMobile: boolean;

  pushLog: (log: ConsoleLog) => void;
  clearLogs: () => void;
  toggleMinimize: () => void;
  toggleExpanded: () => void;
  toggleFilter: (level: LogLevel) => void;
  toggleFiltersPanel: () => void;
  toggleMenu: () => void;
  updateStatus: () => void;
  updateServerStatus: () => void;
  checkState: () => void;
};

const ConsoleContext = createContext<ConsoleContextType | null>(null);

export function useConsole() {
  const context = useContext(ConsoleContext);
  if (!context) {
    throw new Error("useConsole must be used within a ConsoleProvider");
  }
  return context;
}

type ConsoleProviderProps = {
  children: React.ReactNode;
};

/**
 * Error fallback component that displays when an error occurs
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      className="m-4 rounded-lg border border-red-500 bg-red-100 p-4 text-red-900 shadow-lg"
      role="alert"
    >
      <h2 className="mb-2 text-lg font-bold">Something went wrong</h2>
      <p className="mb-4">An error occurred in the application.</p>
      <pre className="mb-4 max-h-40 overflow-auto rounded bg-red-50 p-2 text-sm">
        {error.message}
        {error.stack && (
          <>
            <br />
            {error.stack.split("\n").slice(1).join("\n")}
          </>
        )}
      </pre>
      <button
        className="rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
        onClick={resetErrorBoundary}
      >
        Try again
      </button>
    </div>
  );
}

export function ConsoleProvider({ children }: ConsoleProviderProps) {
  const [logs, setLogs] = useState<ConsoleLog[]>([]);
  const [serverStatus, setServerStatus] = useState<string>("Starting...");
  const [apiPort, setApiPort] = useState<number | null>(null);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showMenu, setShowMenu] = useState<boolean>(false);

  const [isMinimized, setIsMinimized] = useLocalStorage<boolean>(LS_KEY_MINIMIZED, true);
  const [isExpanded, setIsExpanded] = useLocalStorage<boolean>(LS_KEY_EXPANDED, false);
  const [activeFilters, setActiveFilters] = useLocalStorage<LogLevel[]>(LS_KEY_ACTIVE_FILTERS, [
    LogLevel.INFO,
    LogLevel.WARNING,
    LogLevel.ERROR,
    LogLevel.DEBUG,
  ]);

  const filteredLogs = logs.filter((log) => activeFilters.includes(log.status));

  useEffect(() => {
    const handleApiReady = (port: number) => {
      setApiPort(port);
      // Always set to OK when API is ready, regardless of previous state
      setServerStatus("OK");
    };

    const cleanup = window.api.onApiReady(handleApiReady);
    return cleanup;
  }, []);

  const pushLog = useCallback((log: ConsoleLog) => {
    setLogs((prevLogs) =>
      [...prevLogs, log].slice(-MAX_LOG_LENGTH).sort((a, b) => b.timestamp - a.timestamp)
    );
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  const toggleMinimize = useCallback(() => {
    setIsMinimized((prev) => !prev);
  }, [setIsMinimized]);

  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, [setIsExpanded]);

  const toggleFilter = useCallback(
    (level: LogLevel) => {
      setActiveFilters((prevFilters) => {
        if (prevFilters.includes(level)) {
          return prevFilters.filter((f) => f !== level);
        } else {
          return [...prevFilters, level];
        }
      });
    },
    [setActiveFilters]
  );

  const toggleFiltersPanel = useCallback(() => {
    setShowFilters((prev) => !prev);
  }, []);

  const toggleMenu = useCallback(() => {
    setShowMenu((prev) => !prev);
  }, []);

  const updateStatus = useCallback(async () => {
    try {
      await window.api.checkApiReady();
    } catch (error) {
      console.error("Failed to check API status", error);
    }
  }, []);

  const updateServerStatus = useCallback(() => {
    window.api
      .checkApiReady()
      .then((isReady) => {
        // Only set to ERROR if we've already tried to start the API
        // Otherwise keep it as "Starting..."
        if (isReady) {
          setServerStatus("OK");
        } else if (serverStatus !== "Starting...") {
          setServerStatus("ERROR");
        }
      })
      .catch((error) => {
        console.error("Failed to update server status", error);
        // Only set to ERROR if we've already tried to start the API
        if (serverStatus !== "Starting...") {
          setServerStatus("ERROR");
        }
      });
  }, [serverStatus]);

  const checkState = useCallback(async () => {
    setIsExpanded(true);

    try {
      const data = await window.api.fetchData();
      pushLog({
        timestamp: Date.now(),
        message: data as string | object,
        status: LogLevel.INFO,
      });
    } catch (error) {
      pushLog({
        timestamp: Date.now(),
        message: `Error checking state: ${error}`,
        status: LogLevel.ERROR,
      });
    }
  }, [pushLog, setIsExpanded]);

  useEffect(() => {
    updateServerStatus();

    const serverStatusInterval = window.setInterval(updateServerStatus, 30000);

    const logCleanup = window.api.onLogEntry((entry) => {
      pushLog({
        timestamp: Date.now(),
        message: entry.data ? { message: entry.message, data: entry.data } : entry.message,
        status: entry.level,
        source: entry.source,
      });
    });

    return () => {
      window.clearInterval(serverStatusInterval);
      logCleanup();
    };
  }, [pushLog, updateServerStatus]);

  const isMobile = typeof window !== "undefined" ? window.isMobileState || false : false;

  const value = {
    logs,
    filteredLogs,
    isMinimized,
    isExpanded,
    showFilters,
    showMenu,
    activeFilters,
    serverStatus,
    apiPort,
    isMobile,

    pushLog,
    clearLogs,
    toggleMinimize,
    toggleExpanded,
    toggleFilter,
    toggleFiltersPanel,
    toggleMenu,
    updateStatus,
    updateServerStatus,
    checkState,
  };

  const handleError = (error: Error, info: React.ErrorInfo) => {
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", info.componentStack);

    pushLog({
      timestamp: Date.now(),
      message: `Error caught by ErrorBoundary: ${error.message}`,
      status: LogLevel.ERROR,
      source: LogSource.RENDERER,
      data: {
        componentStack: info.componentStack,
        stack: error.stack,
      },
    });
  };

  return (
    <ConsoleContext.Provider value={value}>
      <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
        {children}
      </ErrorBoundary>
    </ConsoleContext.Provider>
  );
}
