import { LogEntry } from "@common/logger-types";
import { LogEntry as LogEntryComponent } from "./LogEntry";

type Props = {
  logs: LogEntry[];
};

export function LogList({ logs }: Props) {
  return (
    <div className="p-4">
      <div className="max-h-[500px] overflow-auto">
        {logs.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-gray-500">
            <p>No logs to display. Use the buttons above to generate logs.</p>
          </div>
        ) : (
          logs.map((log, index) => <LogEntryComponent key={index} log={log} />)
        )}
      </div>
    </div>
  );
}
