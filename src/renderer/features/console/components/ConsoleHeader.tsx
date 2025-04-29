import { ChevronUpIcon, MenuIcon, RefreshCwIcon } from "@renderer/components/icons";
import { cn } from "@renderer/utils/cn";
import { useConsole } from "../ConsoleContext";

/**
 * Header component for the console with expand/collapse controls and server status
 */
export function ConsoleHeader() {
  const { isExpanded, toggleExpanded, isMobile, toggleMenu } = useConsole();
  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-2">
        <button className="rounded-lg p-1 hover:bg-white/10" onClick={toggleExpanded}>
          <div
            className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")}
          >
            <ChevronUpIcon />
          </div>
        </button>
        <div className="flex flex-wrap items-center gap-2">
          <ServerStatusButton />
          <CheckStateButton />
        </div>
      </div>

      {isMobile && (
        <button className="rounded-lg p-1 hover:bg-white/10" onClick={toggleMenu}>
          <MenuIcon />
        </button>
      )}
    </div>
  );
}

/**
 * Button to display and update server status
 */
function ServerStatusButton() {
  const { serverStatus, updateServerStatus } = useConsole();
  return (
    <button
      className="flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10"
      onClick={() => {
        updateServerStatus();
        // TODO: Toast would go here
      }}
    >
      <span className="font-bold">Server:</span>
      <div className="flex items-center gap-1">
        <div className="relative flex h-2 w-2 mx-1">
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              serverStatus === "OK"
                ? "bg-green-400"
                : serverStatus === "Starting..."
                  ? "bg-blue-400"
                  : "bg-red-400"
            )}
          ></span>
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              serverStatus === "OK"
                ? "bg-green-500"
                : serverStatus === "Starting..."
                  ? "bg-blue-500"
                  : "bg-red-500"
            )}
          ></span>
        </div>
        <span
          className={cn(
            serverStatus === "OK"
              ? "text-green-400"
              : serverStatus === "Starting..."
                ? "text-blue-400"
                : "text-red-400"
          )}
        >
          {serverStatus === "OK" ? "Online" : serverStatus}
        </span>
      </div>
    </button>
  );
}

/**
 * Button to check state
 */
function CheckStateButton() {
  const { checkState } = useConsole();
  return (
    <button
      className="group flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10"
      onClick={checkState}
    >
      <RefreshCwIcon />
      <span className="font-bold">Check Status</span>
    </button>
  );
}
