import { cn } from "@renderer/utils/cn";
import { IconProps } from "./icon.types";

export default function Maximize2Icon({ className, color }: IconProps) {
  return (
    <svg
      className={cn("h-4 w-4", className)}
      fill="none"
      stroke={color || "currentColor"}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 3v3a2 2 0 01-2 2H3m18 0h-3a2 2 0 01-2-2V3m0 18v-3a2 2 0 012-2h3M3 16h3a2 2 0 012 2v3"
      />
    </svg>
  );
}
