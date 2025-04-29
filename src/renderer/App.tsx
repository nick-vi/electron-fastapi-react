import { isDevelopment } from "@common/utils";
import { Button } from "@renderer/components/Button";
import { StatusCard } from "@renderer/components/StatusCard";
import {
  AlertTriangleIcon,
  CheckIcon,
  FeatureCheckIcon,
  RefreshIcon,
  SpinnerIcon,
  StatusDotIcon,
  StopIcon,
  WarningIcon,
} from "@renderer/components/icons";
import { Console } from "@renderer/features/console/Console";
import { ErrorBoundaryWithConsole } from "@renderer/features/console/ErrorBoundaryWithConsole";
import { logger } from "@renderer/features/console/logger";
import { ServerStatus, useSidecar } from "@renderer/hooks/useSidecar";
import { cn } from "@renderer/utils/cn";

const MainContent = () => {
  const {
    isError,
    isOk,
    isStarting,
    isStopped,
    isStopping,
    isLoading,
    error,
    start,
    stop,
    restart,
    statusDisplay,
    status,
  } = useSidecar();

  const handleStart = () => {
    start().catch((error: Error) => {
      logger.error("Failed to start API sidecar", error);
    });
  };

  const handleStop = () => {
    stop().catch((error: Error) => {
      logger.error("Failed to stop API sidecar", error);
    });
  };

  const handleRestart = () => {
    restart().catch((error: Error) => {
      logger.error("Failed to restart API sidecar", error);
    });
  };

  return (
    <div className="flex-1 overflow-auto p-4 text-white">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-xl bg-indigo-900/90 p-6 shadow-md border border-white/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Electron FastAPI Sidecar
              </h1>
              <p className="mt-2 text-indigo-200 font-medium">
                A template for building Electron apps with FastAPI Python backends
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={handleStart}
                disabled={isOk || isStarting || isLoading}
                variant="primary"
                size="md"
                isLoading={isStarting}
                statusDot={isStarting ? { color: "blue", animate: true } : undefined}
              >
                {isStarting ? "Starting..." : "Start API"}
              </Button>
              <Button
                onClick={handleStop}
                disabled={!isOk || isLoading}
                variant="danger"
                size="md"
                statusDot={isStopping ? { color: "red", animate: true } : undefined}
              >
                {isStopping ? "Stopping..." : "Stop API"}
              </Button>
              <Button
                onClick={handleRestart}
                disabled={!isOk || isLoading}
                variant="success"
                size="md"
                statusDot={
                  status === ServerStatus.RESTARTING ? { color: "green", animate: true } : undefined
                }
              >
                {status === ServerStatus.RESTARTING ? "Restarting..." : "Restart API"}
              </Button>
            </div>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <StatusCard
            title="API Status"
            value={statusDisplay}
            icon={StatusDotIcon}
            variant={
              isOk
                ? "success"
                : isStarting
                  ? "info"
                  : isError
                    ? "error"
                    : isStopping
                      ? "stopping"
                      : "warning"
            }
          />

          <StatusCard
            title="Loading Status"
            value={isStarting ? "Starting API..." : "Idle"}
            icon={isStarting ? SpinnerIcon : RefreshIcon}
            variant={isStarting ? "info" : "neutral"}
            iconClassName={isStarting ? "animate-spin" : ""}
          />

          <StatusCard
            title="Status Details"
            value={isError ? error || "Error Occurred" : isStopped ? "API Stopped" : "No Errors"}
            icon={isError ? WarningIcon : isStopped ? StopIcon : CheckIcon}
            variant={isError ? "error" : isStopped ? "warning" : "neutral"}
          />
        </div>

        {(isStopped || isError) && !isStarting && (
          <div
            className={cn(
              "mb-6 rounded-lg border p-3 shadow-md",
              isError
                ? "border-red-500/20 bg-red-900/10 text-red-400"
                : "border-yellow-500/20 bg-yellow-900/10 text-yellow-400"
            )}
          >
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-6 w-6 items-center justify-center rounded-lg",
                  isError ? "bg-red-800/30" : "bg-yellow-800/30"
                )}
              >
                <AlertTriangleIcon color={isError ? "rgb(248, 113, 113)" : "rgb(251, 191, 36)"} />
              </div>
              <p className="text-sm">
                {isError
                  ? `Error: ${error || "An unknown error occurred"}`
                  : "The API server is not running. Click the Start API button above to start it."}
              </p>
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-white/20 bg-indigo-900/30 shadow-md">
          <div className="border-b border-white/20 bg-indigo-900/50 px-4 py-3">
            <h2 className="text-lg font-semibold text-white">Features</h2>
          </div>
          <div className="p-4">
            <ul className="grid gap-3 sm:grid-cols-2">
              {[
                "Electron + React frontend",
                "FastAPI Python backend",
                "TypeScript support",
                "Tailwind CSS styling",
              ].map((feature, index) => (
                <li
                  key={index}
                  className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-800/30 border border-green-500/20">
                    <FeatureCheckIcon className="h-4 w-4" color="rgb(74, 222, 128)" />
                  </div>
                  <span className="text-sm font-medium text-white/90">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-900">
      <ErrorBoundaryWithConsole>
        <MainContent />
      </ErrorBoundaryWithConsole>

      {isDevelopment() && <Console />}
    </div>
  );
};
