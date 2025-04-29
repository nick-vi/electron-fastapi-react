import { ConsoleLog, useConsole } from "../ConsoleContext";
import { ConsoleLogItem } from "./ConsoleLogItem";

/**
 * List of log entries with empty state handling
 */
export function ConsoleLogList() {
  const { logs, filteredLogs } = useConsole();
  return (
    <div className="max-h-[50vh] overflow-auto font-mono scrollbar-thin scrollbar-thumb-indigo-300/50 hover:scrollbar-thumb-indigo-300/70 scrollbar-track-indigo-900/50">
      {filteredLogs.length === 0 ? (
        <EmptyState logs={logs} />
      ) : (
        filteredLogs.map((log, index) => <ConsoleLogItem key={index} log={log} />)
      )}
    </div>
  );
}

/**
 * Empty state display when no logs match filters
 */
function EmptyState({ logs }: { logs: ConsoleLog[] }) {
  return (
    <div className="px-2 py-1 text-center text-white/60">
      {logs.length === 0 ? "No logs yet" : "No logs match the current filter"}
    </div>
  );
}
