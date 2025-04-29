import { logger } from "@renderer/features/console/logger";
import { useCallback, useEffect, useRef, useState } from "react";

export const ServerStatus = {
  STARTING: "STARTING",
  OK: "OK",
  STOPPED: "STOPPED",
  ERROR: "ERROR",
  STOPPING: "STOPPING",
  RESTARTING: "RESTARTING",
} as const;

export type ServerStatus = (typeof ServerStatus)[keyof typeof ServerStatus];

export const isError = (status: ServerStatus): boolean => status === ServerStatus.ERROR;
export const isStarting = (status: ServerStatus): boolean =>
  status === ServerStatus.STARTING || status === ServerStatus.RESTARTING;
export const isOk = (status: ServerStatus): boolean => status === ServerStatus.OK;
export const isStopped = (status: ServerStatus): boolean => status === ServerStatus.STOPPED;
export const isStopping = (status: ServerStatus): boolean => status === ServerStatus.STOPPING;

export function useSidecar() {
  const [status, setStatus] = useState<ServerStatus>(ServerStatus.STOPPED);
  const [port, setPort] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const hasStartedRef = useRef(false);

  const start = useCallback(async () => {
    if (hasStartedRef.current) {
      logger.debug("API sidecar already starting, ignoring start request");
      return;
    }

    const startTime = Date.now();
    logger.info("API Lifecycle: Starting API sidecar...");

    hasStartedRef.current = true;
    setIsLoading(true);
    setStatus(ServerStatus.STARTING);
    setError(null);

    try {
      const port = await window.api.startApiSidecar();
      const duration = Date.now() - startTime;

      logger.info(`API Lifecycle: API sidecar process started (port: ${port}, took ${duration}ms)`);
      setPort(port);
      updateServerStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const duration = Date.now() - startTime;

      logger.error(
        `API Lifecycle: Error starting API sidecar after ${duration}ms: ${errorMessage}`,
        err instanceof Error ? err : undefined
      );

      setError(errorMessage);
      setIsLoading(false);
      setStatus(ServerStatus.ERROR);
      hasStartedRef.current = false;
    }
  }, []);

  const stop = useCallback(async () => {
    const startTime = Date.now();
    logger.info("API Lifecycle: Stopping API sidecar...");

    setIsLoading(true);
    setStatus(ServerStatus.STOPPING);
    setError(null);

    try {
      await window.api.stopApiSidecar();
      const duration = Date.now() - startTime;

      logger.info(`API Lifecycle: API sidecar process stopped (took ${duration}ms)`);

      setPort(null);
      setStatus(ServerStatus.STOPPED);
      setIsLoading(false);
      hasStartedRef.current = false;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const duration = Date.now() - startTime;

      logger.error(
        `API Lifecycle: Error stopping API sidecar after ${duration}ms: ${errorMessage}`,
        err instanceof Error ? err : undefined
      );

      setStatus(ServerStatus.ERROR);
      setError(`Error stopping API sidecar: ${errorMessage}`);
      setIsLoading(false);
      hasStartedRef.current = false;
    }
  }, []);

  const restart = useCallback(async () => {
    const startTime = Date.now();
    logger.info("API Lifecycle: Restarting API sidecar...");

    setIsLoading(true);
    setStatus(ServerStatus.RESTARTING);
    setError(null);

    try {
      const port = await window.api.restartApiSidecar();
      const duration = Date.now() - startTime;

      logger.info(
        `API Lifecycle: API sidecar process restarted (port: ${port}, took ${duration}ms)`
      );

      setPort(port);
      updateServerStatus();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      const duration = Date.now() - startTime;

      logger.error(
        `API Lifecycle: Error restarting API sidecar after ${duration}ms: ${errorMessage}`,
        err instanceof Error ? err : undefined
      );

      setError(errorMessage);
      setIsLoading(false);
      setStatus(ServerStatus.ERROR);
      hasStartedRef.current = false;
    }
  }, []);

  const updateServerStatus = useCallback(() => {
    if (status === ServerStatus.STARTING || status === ServerStatus.RESTARTING) {
      return;
    }

    if (!port) {
      setStatus(ServerStatus.STOPPED);
      setIsLoading(false);
      setError(null);
      return;
    }

    window.api
      .checkApiReady()
      .then((ready) => {
        if (ready) {
          setStatus(ServerStatus.OK);
          setIsLoading(false);
          setError(null);
          hasStartedRef.current = false;
        } else {
          if (hasStartedRef.current) {
            setStatus(ServerStatus.STARTING);
            setIsLoading(true);
          } else {
            setStatus(ServerStatus.STOPPED);
            setIsLoading(false);
            setError(null);
          }
        }
      })
      .catch((err) => {
        logger.error("Failed to update server status", err instanceof Error ? err : undefined);

        if (hasStartedRef.current) {
          setStatus(ServerStatus.STARTING);
          setIsLoading(true);
        } else {
          setStatus(ServerStatus.STOPPED);
          setIsLoading(false);
          setError(null);
        }
      });
  }, [status, port]);

  useEffect(() => {
    const handleApiReady = (portNumber: number) => {
      setPort(portNumber);
      setStatus(ServerStatus.OK);
      setError(null);
      setIsLoading(false);
      hasStartedRef.current = false;
    };

    const handleApiExit = (exitCode: number) => {
      if (exitCode === 0) {
        setStatus(ServerStatus.STOPPED);
        setError(null);
      } else {
        setStatus(ServerStatus.ERROR);
        setError(`API process exited with code ${exitCode}`);
      }
      setIsLoading(false);
      hasStartedRef.current = false;
    };

    const readyCleanup = window.api.onApiReady(handleApiReady);
    const exitCleanup = window.api.onApiProcessExit(handleApiExit);

    return () => {
      readyCleanup();
      exitCleanup();
    };
  }, []);

  useEffect(() => {
    updateServerStatus();

    const interval = window.setInterval(() => {
      updateServerStatus();
    }, 5000);

    return () => window.clearInterval(interval);
  }, [updateServerStatus]);

  const getStatusDisplay = useCallback(() => {
    switch (status) {
      case ServerStatus.OK:
        return `Online${port ? ` (Port: ${port})` : ""}`;
      case ServerStatus.STARTING:
        return "Starting...";
      case ServerStatus.RESTARTING:
        return "Restarting...";
      case ServerStatus.STOPPING:
        return "Stopping...";
      case ServerStatus.STOPPED:
        return "Stopped";
      case ServerStatus.ERROR:
        return `Error${error ? `: ${error}` : ""}`;
      default:
        return "Unknown";
    }
  }, [status, port, error]);

  return {
    status,
    port,
    error,
    isLoading,
    isError: isError(status),
    isOk: isOk(status),
    isStarting: isStarting(status),
    isStopped: isStopped(status),
    isStopping: isStopping(status),
    statusDisplay: getStatusDisplay(),

    start,
    stop,
    restart,

    updateServerStatus,
  };
}
