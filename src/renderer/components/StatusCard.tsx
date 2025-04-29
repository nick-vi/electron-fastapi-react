import { cn } from "@renderer/utils/cn";
import { ComponentType } from "react";
import { IconProps } from "./icons/icon.types";

type Props = {
  title: string;
  value: string;
  icon: ComponentType<IconProps>;
  variant: "success" | "info" | "warning" | "error" | "neutral" | "stopping";
  className?: string;
  iconClassName?: string;
};

export function StatusCard({ title, value, icon: Icon, variant, className, iconClassName }: Props) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          card: "border-emerald-500/20 bg-emerald-900/10",
          container: "bg-emerald-800/30",
          indicator: "bg-emerald-500",
          text: "text-emerald-400",
        };
      case "info":
        return {
          card: "border-blue-500/20 bg-blue-900/10",
          container: "bg-blue-800/30",
          indicator: "bg-blue-500",
          text: "text-blue-400",
        };
      case "warning":
        return {
          card: "border-amber-500/20 bg-amber-900/10",
          container: "bg-amber-800/30",
          indicator: "bg-amber-500",
          text: "text-amber-400",
        };
      case "error":
        return {
          card: "border-red-500/20 bg-red-900/10",
          container: "bg-red-800/30",
          indicator: "bg-red-500",
          text: "text-red-400",
        };
      case "stopping":
        return {
          card: "border-purple-500/20 bg-purple-900/10",
          container: "bg-purple-800/30",
          indicator: "bg-purple-500",
          text: "text-purple-400",
        };
      default:
        return {
          card: "border-slate-500/20 bg-slate-900/10",
          container: "bg-slate-800/30",
          indicator: "bg-slate-500",
          text: "text-slate-400",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={cn(
        "flex items-center rounded-lg border p-4 shadow-md transition-all duration-200 bg-indigo-900/30",
        styles.card,
        className
      )}
    >
      <div
        className={cn(
          "mr-3 flex h-10 w-10 items-center justify-center rounded-lg",
          styles.container
        )}
      >
        <Icon
          className={cn("h-5 w-5", iconClassName)}
          color={
            variant === "success"
              ? "rgb(74, 222, 128)" // green-400
              : variant === "info"
                ? "rgb(96, 165, 250)" // blue-400
                : variant === "warning"
                  ? "rgb(251, 191, 36)" // amber-400
                  : variant === "error"
                    ? "rgb(248, 113, 113)" // red-400
                    : variant === "stopping"
                      ? "rgb(192, 132, 252)" // purple-400
                      : "rgb(148, 163, 184)" // slate-400
          }
        />
      </div>
      <div>
        <p className="text-xs font-semibold text-white/80">{title}</p>
        <p className={cn("text-sm font-medium", styles.text)}>{value}</p>
      </div>
    </div>
  );
}
