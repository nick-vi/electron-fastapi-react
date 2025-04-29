import { LogLevel } from "@common/logger-types";
import { cn } from "@renderer/utils/cn";

type Props = {
  level: LogLevel;
  label: string;
  isActive: boolean;
  toggleFilter: (level: LogLevel) => void;
  activeColor: string;
  inactiveColor: string;
};

export function FilterButton({
  level,
  label,
  isActive,
  toggleFilter,
  activeColor,
  inactiveColor,
}: Props) {
  return (
    <button
      className={cn(
        "rounded-lg border px-2 py-1",
        isActive ? activeColor : `${inactiveColor} opacity-50`
      )}
      onClick={() => toggleFilter(level)}
    >
      {label}
    </button>
  );
}
