import { cn } from "@renderer/utils/cn";
import { IconProps } from "./icon.types";

export default function StopIcon({ className, color }: IconProps) {
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
        d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}
