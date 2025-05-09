import { cn } from "@renderer/utils/cn";
import { IconProps } from "./icon.types";

export default function WarningIcon({ className, color }: IconProps) {
  return (
    <svg
      className={cn("h-6 w-6", className)}
      fill="none"
      stroke={color || "currentColor"}
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  );
}
