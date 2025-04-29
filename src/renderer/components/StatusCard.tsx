import { cn } from "@renderer/utils/cn";
import { ComponentType } from "react";
import { IconProps } from "./icons/icon.types";

type StatusCardProps = {
  title: string;
  value: string;
  icon: ComponentType<IconProps>;
  variant: "success" | "info" | "warning" | "error" | "neutral" | "stopping";
  className?: string;
  iconClassName?: string;
};

export function StatusCard({
  title,
  value,
  icon: Icon,
  variant,
  className,
  iconClassName,
}: StatusCardProps) {
  const getVariantStyles = () => {
    switch (variant) {
      case "success":
        return {
          card: "border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50",
          container: "bg-emerald-100 shadow-emerald-200/50",
          indicator: "bg-emerald-500 shadow-emerald-400/50",
          text: "text-emerald-600",
        };
      case "info":
        return {
          card: "border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50",
          container: "bg-blue-100 shadow-blue-200/50",
          indicator: "bg-blue-500 shadow-blue-400/50",
          text: "text-blue-600",
        };
      case "warning":
        return {
          card: "border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50",
          container: "bg-amber-100 shadow-amber-200/50",
          indicator: "bg-amber-500 shadow-amber-400/50",
          text: "text-amber-600",
        };
      case "error":
        return {
          card: "border-red-200 bg-gradient-to-br from-red-50 to-red-100/50",
          container: "bg-red-100 shadow-red-200/50",
          indicator: "bg-red-500 shadow-red-400/50",
          text: "text-red-600",
        };
      case "stopping":
        return {
          card: "border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100/50",
          container: "bg-purple-100 shadow-purple-200/50",
          indicator: "bg-purple-500 shadow-purple-400/50",
          text: "text-purple-600",
        };
      default:
        return {
          card: "border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50",
          container: "bg-slate-100 shadow-slate-200/50",
          indicator: "bg-slate-500 shadow-slate-400/50",
          text: "text-slate-600",
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <div
      className={cn(
        "flex items-center rounded-xl border p-5 shadow-md transition-all duration-200",
        styles.card,
        className
      )}
    >
      <div
        className={cn(
          "mr-4 flex h-12 w-12 items-center justify-center rounded-full shadow-inner",
          styles.container
        )}
      >
        <Icon
          className={cn("h-6 w-6", iconClassName)}
          color={
            variant === "success"
              ? "rgb(16, 185, 129)" // emerald-500
              : variant === "info"
                ? "rgb(59, 130, 246)" // blue-500
                : variant === "warning"
                  ? "rgb(245, 158, 11)" // amber-500
                  : variant === "error"
                    ? "rgb(239, 68, 68)" // red-500
                    : variant === "stopping"
                      ? "rgb(168, 85, 247)" // purple-500
                      : "rgb(100, 116, 139)" // slate-500
          }
        />
      </div>
      <div>
        <p className="text-sm font-semibold text-gray-700">{title}</p>
        <p className={cn("text-base font-medium", styles.text)}>{value}</p>
      </div>
    </div>
  );
}
