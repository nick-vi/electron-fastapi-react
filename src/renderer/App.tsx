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
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 rounded-xl bg-gradient-to-br from-indigo-800 via-blue-700 to-indigo-900 p-8 shadow-md border border-indigo-500/20">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div className="mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-white tracking-tight">
                Electron FastAPI Sidecar
              </h1>
              <p className="mt-2 text-indigo-200 font-medium">
                A template for building Electron apps with FastAPI Python backends
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleStart}
                disabled={isOk || isStarting || isLoading}
                variant="primary"
                size="md"
                isLoading={isStarting}
              >
                {isStarting ? "Starting..." : "Start API"}
              </Button>
              <Button
                onClick={handleStop}
                disabled={!isOk || isLoading}
                variant="danger"
                size="md"
                isLoading={isStopping}
              >
                {isStopping ? "Stopping..." : "Stop API"}
              </Button>
              <Button
                onClick={handleRestart}
                disabled={!isOk || isLoading}
                variant="success"
                size="md"
                isLoading={status === ServerStatus.RESTARTING}
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
              "mb-6 rounded-xl border p-4 shadow-md",
              isError
                ? "border-red-200 bg-gradient-to-br from-red-50 to-red-100/50 text-red-800"
                : "border-yellow-200 bg-gradient-to-br from-yellow-50 to-yellow-100/50 text-yellow-800"
            )}
          >
            <div className="flex items-center">
              <AlertTriangleIcon
                className="mr-3"
                color={isError ? "rgb(239, 68, 68)" : "rgb(245, 158, 11)"}
              />
              <p>
                {isError
                  ? `Error: ${error || "An unknown error occurred"}`
                  : "The API server is not running. Click the Start API button above to start it."}
              </p>
            </div>
          </div>
        )}

        <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-slate-100/50 shadow-md">
          <div className="border-b border-slate-200 bg-slate-50/80 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-800">Features</h2>
          </div>
          <div className="p-6">
            <ul className="grid gap-4 sm:grid-cols-2">
              <li className="flex items-start">
                <FeatureCheckIcon color="rgb(34, 197, 94)" />
                <span>Electron + React frontend</span>
              </li>
              <li className="flex items-start">
                <FeatureCheckIcon color="rgb(34, 197, 94)" />
                <span>FastAPI Python backend</span>
              </li>
              <li className="flex items-start">
                <FeatureCheckIcon color="rgb(34, 197, 94)" />
                <span>TypeScript support</span>
              </li>
              <li className="flex items-start">
                <FeatureCheckIcon color="rgb(34, 197, 94)" />
                <span>Tailwind CSS styling</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export const App = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      <ErrorBoundaryWithConsole>
        <MainContent />
      </ErrorBoundaryWithConsole>

      {isDevelopment() && <Console />}
    </div>
  );
};
