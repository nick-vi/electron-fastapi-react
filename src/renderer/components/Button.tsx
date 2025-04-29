import { cn } from "@renderer/utils/cn";
import { ButtonHTMLAttributes, ReactNode } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "success" | "danger" | "secondary" | "warning";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  icon?: ReactNode;
  statusDot?: {
    color: "green" | "blue" | "red" | "yellow" | "purple";
    animate?: boolean;
  };
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  isLoading = false,
  icon,
  statusDot,
  ...props
}: Props) {
  const baseStyles =
    "cursor-pointer inline-flex items-center justify-center rounded-lg font-semibold transition-all duration-200 focus:outline-none";

  const sizeStyles = {
    sm: "px-2 py-1 text-xs gap-1.5",
    md: "px-3 py-1.5 text-sm gap-2",
    lg: "px-4 py-2 text-base gap-2",
  };

  // Console-style buttons with hover effect
  const variantStyles = {
    primary:
      disabled || isLoading ? "text-white/50 cursor-not-allowed" : "text-white hover:bg-white/10",
    secondary:
      disabled || isLoading
        ? "text-white/50 cursor-not-allowed"
        : "text-white/80 hover:bg-white/10",
    success:
      disabled || isLoading
        ? "text-green-400/50 cursor-not-allowed"
        : "text-green-400 hover:bg-white/10",
    danger:
      disabled || isLoading
        ? "text-red-400/50 cursor-not-allowed"
        : "text-red-400 hover:bg-white/10",
    warning:
      disabled || isLoading
        ? "text-yellow-400/50 cursor-not-allowed"
        : "text-yellow-400 hover:bg-white/10",
  };

  const renderStatusDot = () => {
    if (!statusDot) return null;

    const bgColorMap = {
      green: "bg-green-400",
      blue: "bg-blue-400",
      red: "bg-red-400",
      yellow: "bg-yellow-400",
      purple: "bg-purple-400",
    };

    const solidColorMap = {
      green: "bg-green-500",
      blue: "bg-blue-500",
      red: "bg-red-500",
      yellow: "bg-yellow-500",
      purple: "bg-purple-500",
    };

    return (
      <div className="relative flex h-3 w-3 mr-1">
        {statusDot.animate && (
          <span
            className={cn(
              "absolute inline-flex h-full w-full animate-ping rounded-full opacity-75",
              bgColorMap[statusDot.color]
            )}
          />
        )}
        <span
          className={cn(
            "relative inline-flex h-3 w-3 rounded-full",
            solidColorMap[statusDot.color]
          )}
        />
      </div>
    );
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <div className="relative flex h-3 w-3 mr-1">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 bg-blue-400" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
        </div>
      ) : statusDot ? (
        renderStatusDot()
      ) : icon ? (
        <span className="flex items-center justify-center">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
