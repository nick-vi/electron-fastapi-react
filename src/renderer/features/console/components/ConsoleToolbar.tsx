import { FilterIcon, MinimizeIcon, TrashIcon } from "@renderer/components/icons";
import { useSidecar } from "@renderer/hooks/useSidecar";
import { cn } from "@renderer/utils/cn";
import { useConsole } from "../ConsoleContext";

/**
 * Toolbar component with API port, filters, and action buttons
 */
export function ConsoleToolbar() {
  const {
    showFilters,
    toggleFiltersPanel,
    activeFilters,
    clearLogs,
    toggleMinimize,
    logs,
    isMobile,
  } = useConsole();
  const { port, isOk } = useSidecar();
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 p-2",
        isMobile && "border-t border-white/20"
      )}
    >
      <div className="flex items-center gap-1">
        <span className="font-bold">Port:</span>
        <span
          className={cn(
            "h-6 w-14 rounded-md bg-white/10 px-2 py-1 text-center font-mono",
            !isOk && "animate-pulse"
          )}
        >
          {isOk && port ? port : "..."}
        </span>
      </div>

      <button
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10",
          showFilters && "bg-white/10"
        )}
        onClick={toggleFiltersPanel}
      >
        <FilterIcon />
        <span className="font-bold">Filter</span>
        <span className="text-xs opacity-60">({activeFilters.length})</span>
      </button>
      <button
        className={cn(
          "flex items-center gap-1 rounded-lg px-2 py-1 hover:bg-white/10",
          "text-red-300 hover:text-red-200 disabled:opacity-50 disabled:hover:bg-transparent"
        )}
        onClick={clearLogs}
        disabled={logs.length === 0}
      >
        <TrashIcon />
        <span className="font-bold">Clear</span>
      </button>
      <button className="rounded-lg p-1 hover:bg-white/10" onClick={toggleMinimize}>
        <MinimizeIcon />
      </button>
    </div>
  );
}
