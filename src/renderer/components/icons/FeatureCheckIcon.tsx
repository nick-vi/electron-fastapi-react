import { cn } from "@renderer/utils/cn";
import { IconProps } from "./icon.types";

export default function FeatureCheckIcon({ className, color }: IconProps) {
  return (
    <svg
      className={cn("h-5 w-5", className)}
      fill="none"
      stroke={color || "currentColor"}
      viewBox="0 0 24 24"
    >
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}
