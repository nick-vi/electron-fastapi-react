import type { LogEntry } from "@common/logger-types";
import { isError, isInfo, isWarning } from "@common/logger-types";

type Props = {
  log: LogEntry;
};

const formatLogData = (data: unknown): string => {
  if (typeof data === "string") return data;
  if (typeof data === "object" && data !== null) {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "[Object]";
    }
  }
  return String(data);
};

const getLogColor = (log: LogEntry): string => {
  if (isError(log)) return "bg-red-50 border-l-4 border-red-500 text-red-800";
  if (isWarning(log)) return "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-800";
  if (isInfo(log)) return "bg-blue-50 border-l-4 border-blue-500 text-blue-800";
  return "bg-gray-50 border-l-4 border-gray-500 text-gray-800";
};

const getSourceBadgeColor = (source: string): string => {
  switch (source.toLowerCase()) {
    case "main":
      return "bg-purple-100 text-purple-800";
    case "renderer":
      return "bg-green-100 text-green-800";
    case "python":
      return "bg-blue-100 text-blue-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export function LogEntry({ log }: Props) {
  const formattedData = log.data ? formatLogData(log.data) : null;

  return (
    <div className={`mb-2 rounded-md p-3 ${getLogColor(log)}`}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded bg-opacity-80 px-1.5 py-0.5 text-xs font-bold">
          {log.level.toUpperCase()}
        </span>
        <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${getSourceBadgeColor(log.source)}`}>
          {log.source}
        </span>
        <span className="text-xs text-gray-500">
          {new Date(log.timestamp).toLocaleTimeString()}
        </span>
      </div>
      <p className="mt-2 font-medium">{log.message}</p>
      {formattedData && (
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-800 p-2 text-xs text-white">
          {formattedData}
        </pre>
      )}
      {log.exception && (
        <pre className="mt-2 max-h-40 overflow-auto rounded bg-red-900 p-2 text-xs text-white">
          {log.exception}
        </pre>
      )}
    </div>
  );
}
