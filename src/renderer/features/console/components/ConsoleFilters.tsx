import { LogLevel } from "@common/logger-types";
import { useConsole } from "../ConsoleContext";
import { FilterButton } from "./FilterButton";

export function ConsoleFilters() {
  const { activeFilters, toggleFilter } = useConsole();
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-white/20 p-2">
      <span className="mr-2 font-bold">Log Levels:</span>
      <FilterButton
        level={LogLevel.INFO}
        label="Info"
        isActive={activeFilters.includes(LogLevel.INFO)}
        toggleFilter={toggleFilter}
        activeColor="border-green-500 bg-green-500/30"
        inactiveColor="border-green-500/30"
      />
      <FilterButton
        level={LogLevel.WARNING}
        label="Warning"
        isActive={activeFilters.includes(LogLevel.WARNING)}
        toggleFilter={toggleFilter}
        activeColor="border-yellow-500 bg-yellow-500/30"
        inactiveColor="border-yellow-500/30"
      />
      <FilterButton
        level={LogLevel.ERROR}
        label="Error"
        isActive={activeFilters.includes(LogLevel.ERROR)}
        toggleFilter={toggleFilter}
        activeColor="border-red-500 bg-red-500/30"
        inactiveColor="border-red-500/30"
      />
      <FilterButton
        level={LogLevel.DEBUG}
        label="Debug"
        isActive={activeFilters.includes(LogLevel.DEBUG)}
        toggleFilter={toggleFilter}
        activeColor="border-blue-500 bg-blue-500/30"
        inactiveColor="border-blue-500/30"
      />
    </div>
  );
}
