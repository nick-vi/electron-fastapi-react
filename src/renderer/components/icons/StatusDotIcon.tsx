import { cn } from "@renderer/utils/cn";
import { IconProps } from "./icon.types";

export default function StatusDotIcon({ className, color }: IconProps) {
  return (
    <div
      className={cn("h-4 w-4 rounded-full shadow-sm animate-pulse", className)}
      style={{ backgroundColor: color || "currentColor" }}
    />
  );
}
