import { cn } from "@renderer/utils/cn";
import { IconProps } from "./icon.types";

export default function Minimize({ className, color }: IconProps) {
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
        d="M15 3h6v6M14 10L21 3M9 21H3v-6M10 14L3 21"
      />
    </svg>
  );
}
