import { cn } from "@renderer/utils/cn";
import { IconProps } from "./icon.types";

export default function RefreshCw({ className, color }: IconProps) {
  return (
    <svg
      className={cn("h-4 w-4 group-hover:animate-spin", className)}
      fill="none"
      stroke={color || "currentColor"}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
      />
    </svg>
  );
}
