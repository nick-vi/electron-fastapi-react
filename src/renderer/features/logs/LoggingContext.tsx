import { LogLevel, LogSource, type LogEntry } from "@common/logger-types";
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type LoggingContext = {
  logs: LogEntry[];
  addLog: (level: LogLevel, message: string, data?: unknown) => void;
  clearLogs: () => void;
};

const LoggingContext = createContext<LoggingContext | null>(null);

export { LogLevel };
export type { LogEntry };

export const useLogging = () => {
  const context = useContext(LoggingContext);
  if (!context) {
    throw new Error("useLogging must be used within a LoggingProvider");
  }
  return context;
};

type Props = {
  children: ReactNode;
};

export function LoggingProvider({ children }: Props) {
  const [logs, setLogs] = useState<LogEntry[]>([]);

  const addLog = (level: LogLevel, message: string, data?: unknown) => {
    setLogs((prevLogs) => [
      ...prevLogs,
      {
        level,
        message,
        timestamp: new Date().toISOString(),
        source: LogSource.RENDERER,
        data,
      },
    ]);
  };

  const clearLogs = () => {
    setLogs([]);
    window.api.clearLogs();
  };
  useEffect(() => {
    const addLogEntry = (entry: LogEntry) => {
      setLogs((prevLogs) => [...prevLogs, entry]);
    };

    window.api.getLogs().then((mainLogs) => {
      setLogs((prevLogs) => [...prevLogs, ...mainLogs]);
    });

    const cleanup = window.api.onLogEntry(addLogEntry);

    return () => {
      cleanup();
    };
  }, []);

  return (
    <LoggingContext.Provider value={{ logs, addLog, clearLogs }}>
      {children}
    </LoggingContext.Provider>
  );
};
