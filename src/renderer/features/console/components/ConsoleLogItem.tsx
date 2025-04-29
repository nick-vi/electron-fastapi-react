import {
  LogLevel,
  LogSource,
  isDebug,
  isError,
  isInfo,
  isMain,
  isPython,
  isRenderer,
  isUvicorn,
  isWarning,
} from "@common/logger-types";
import { cn } from "@renderer/utils/cn";
import { MessageFormatter } from "./MessageFormatter";

type Props = {
  log: {
    timestamp: number;
    message: string | object;
    status: LogLevel;
    source?: LogSource;
  };
};

/**
 * Individual log entry with formatting
 */
export function ConsoleLogItem({ log }: Props) {
  return (
    <div
      className={cn("whitespace-pre-wrap border-b border-white/10 px-2 py-1 border-l-2 ", {
        "border-l-green-400": isInfo(log.status),
        "border-l-yellow-400": isWarning(log.status),
        "border-l-red-400": isError(log.status),
        "border-l-blue-400": isDebug(log.status),
      })}
    >
      <LogTimestamp timestamp={log.timestamp} />
      <LogLevelDisplay level={log.status} />
      {log.source && <LogSourceDisplay source={log.source} />}
      <MessageFormatter message={log.message} />
    </div>
  );
}

/**
 * Timestamp display for log entry
 */
function LogTimestamp({ timestamp }: { timestamp: number }) {
  return <span className="text-white/60">[{new Date(timestamp).toLocaleString()}]</span>;
}

/**
 * Log level display with appropriate color
 */
function LogLevelDisplay({ level }: { level: LogLevel }) {
  return (
    <span
      className={cn("mx-2", {
        "text-green-400": isInfo(level),
        "text-yellow-400": isWarning(level),
        "text-red-400": isError(level),
        "text-blue-400": isDebug(level),
      })}
    >
      [{level}]
    </span>
  );
}

/**
 * Source display for log entry
 */
function LogSourceDisplay({ source }: { source: LogSource }) {
  return (
    <span
      className={cn("mr-2", {
        "text-purple-400": isMain(source),
        "text-rose-400": isRenderer(source),
        "text-teal-400": isUvicorn(source),
        "text-orange-400": isPython(source),
      })}
    >
      [{source}]
    </span>
  );
}
