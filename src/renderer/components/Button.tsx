import { cn } from "@renderer/utils/cn";
import { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "success" | "danger" | "secondary" | "warning";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
};

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  disabled,
  isLoading = false,
  ...props
}: ButtonProps) {
  const baseStyles =
    "cursor-pointer inline-flex items-center justify-center rounded-md font-semibold shadow-sm transition-all duration-200 focus:outline-none";

  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantStyles = {
    primary:
      disabled || isLoading
        ? "bg-indigo-400/50 text-white/70 cursor-not-allowed"
        : "bg-indigo-500 text-white hover:bg-indigo-400 hover:shadow-md",
    secondary:
      disabled || isLoading
        ? "bg-slate-400/50 text-white/70 cursor-not-allowed"
        : "bg-slate-500 text-white hover:bg-slate-400 hover:shadow-md",
    success:
      disabled || isLoading
        ? "bg-emerald-400/30 text-white/70 cursor-not-allowed"
        : "bg-emerald-600 text-white hover:bg-emerald-500 hover:shadow-md",
    danger:
      disabled || isLoading
        ? "bg-red-400/30 text-white/70 cursor-not-allowed"
        : "bg-red-600 text-white hover:bg-red-500 hover:shadow-md",
    warning:
      disabled || isLoading
        ? "bg-amber-400/30 text-white/70 cursor-not-allowed"
        : "bg-amber-500 text-white hover:bg-amber-400 hover:shadow-md",
  };

  return (
    <button
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="mr-2 h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      )}
      {children}
    </button>
  );
}
