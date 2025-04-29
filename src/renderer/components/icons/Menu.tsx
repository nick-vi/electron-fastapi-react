import { cn } from "@renderer/utils/cn";
import { IconProps } from "./icon.types";

export default function Menu({ className, color }: IconProps) {
  return (
    <svg
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke={color || "currentColor"}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6h16M4 12h16M4 18h16"
      />
    </svg>
  );
}
