import { ChevronUpIcon, MenuIcon, RefreshCwIcon } from "@renderer/components/icons";
import { ServerStatus, useSidecar } from "@renderer/hooks/useSidecar";
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

function getStatusDisplay(status: ServerStatus) {
  switch (status) {
    case ServerStatus.OK:
      return "Online";
    case ServerStatus.STARTING:
      return "Starting...";
    case ServerStatus.STOPPED:
      return "Stopped";
    default:
      return "Error";
  }
}

/**
 * Button to display and update server status
 */
function ServerStatusButton() {
  const { isOk, isStarting, isError, status, updateServerStatus } = useSidecar();

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
              isOk
                ? "bg-green-400"
                : isStarting
                  ? "bg-blue-400"
                  : isError
                    ? "bg-red-400"
                    : "bg-yellow-400"
            )}
          ></span>
          <span
            className={cn(
              "relative inline-flex h-2 w-2 rounded-full",
              isOk
                ? "bg-green-500"
                : isStarting
                  ? "bg-blue-500"
                  : isError
                    ? "bg-red-500"
                    : "bg-yellow-500"
            )}
          ></span>
        </div>
        <span
          className={cn(
            isOk
              ? "text-green-400"
              : isStarting
                ? "text-blue-400"
                : isError
                  ? "text-red-400"
                  : "text-yellow-400"
          )}
        >
          {getStatusDisplay(status)}
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
