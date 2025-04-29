"use client";

import { LogLevel, LogSource } from "@common/logger-types";
import React, { ErrorInfo } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";
import { useConsole } from "./ConsoleContext";
import { logger } from "./logger";

type Props = {
  children: React.ReactNode;
};

/**
 * Error fallback component that displays when an error occurs
 */
function ErrorFallback({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div
      className="m-4 rounded-lg border border-red-500 bg-red-100 p-4 text-red-900 shadow-lg"
      role="alert"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Something went wrong</h2>
        <span className="text-xs text-red-700">Error details logged to console</span>
      </div>
      
      <p className="my-2">
        An error occurred in the application. The error has been logged to the console for
        debugging.
      </p>
      
      <div className="mb-4 rounded border border-red-300 bg-red-50 p-2">
        <div className="font-medium">Error: {error.message}</div>
        {error.stack && (
          <pre className="mt-2 max-h-32 overflow-auto text-xs text-red-800">
            {error.stack.split("\n").slice(1, 4).join("\n")}
            {error.stack.split("\n").length > 4 && "\n..."}
          </pre>
        )}
      </div>
      
      <div className="flex gap-2">
        <button
          className="rounded bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-700"
          onClick={resetErrorBoundary}
        >
          Try again
        </button>
        <button
          className="rounded border border-red-600 px-4 py-2 font-bold text-red-600 hover:bg-red-50"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
      </div>
    </div>
  );
}

/**
 * Error boundary that logs errors to the console
 */
export function ErrorBoundaryWithConsole({ children }: Props) {
  const { pushLog } = useConsole();

  const handleError = (error: Error, info: ErrorInfo) => {
    // Log to browser console
    console.error("Error caught by ErrorBoundary:", error);
    console.error("Component stack:", info.componentStack);

    // Log to our custom logger
    logger.error("Error caught by ErrorBoundary", error, {
      componentStack: info.componentStack,
    });

    // Push to console UI
    pushLog({
      timestamp: Date.now(),
      message: `Error caught by ErrorBoundary: ${error.message}`,
      status: LogLevel.ERROR,
      source: LogSource.RENDERER,
      data: {
        componentStack: info.componentStack,
        stack: error.stack,
      },
    });
  };

  return (
    <ErrorBoundary FallbackComponent={ErrorFallback} onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}
