import { logger } from "@renderer/features/console/logger";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Object containing all possible states of the API sidecar
 */
export const ServerStatus = {
  /** API is in the process of starting */
  STARTING: "STARTING",

  /** API is running and ready to accept requests */
  OK: "OK",

  /** API is not running */
  STOPPED: "STOPPED",

  /** API encountered an error */
  ERROR: "ERROR",

  /** API is in the process of stopping */
  STOPPING: "STOPPING",

  /** API is in the process of restarting */
  RESTARTING: "RESTARTING",
} as const;

/** Type representing the possible states of the API sidecar */
export type ServerStatus = (typeof ServerStatus)[keyof typeof ServerStatus];

/**
 * Check if the API is in an error state
 * @param status Current status of the API
 * @returns True if the API is in an error state
 */
export const isError = (status: ServerStatus): boolean => status === ServerStatus.ERROR;

/**
 * Check if the API is in the process of starting or restarting
 * @param status Current status of the API
 * @returns True if the API is starting or restarting
 */
export const isStarting = (status: ServerStatus): boolean =>
  status === ServerStatus.STARTING || status === ServerStatus.RESTARTING;

/**
 * Check if the API is running and ready
 * @param status Current status of the API
 * @returns True if the API is running and ready
 */
export const isOk = (status: ServerStatus): boolean => status === ServerStatus.OK;

/**
 * Check if the API is stopped
 * @param status Current status of the API
 * @returns True if the API is stopped
 */
export const isStopped = (status: ServerStatus): boolean => status === ServerStatus.STOPPED;

/**
 * Check if the API is in the process of stopping
 * @param status Current status of the API
 * @returns True if the API is stopping
 */
export const isStopping = (status: ServerStatus): boolean => status === ServerStatus.STOPPING;

/**
 * Hook for managing the API sidecar lifecycle
 *
 * This hook provides a unified interface for starting, stopping, and monitoring
 * the API sidecar process. It handles all the complexity of managing the API
 * lifecycle, including state management, error handling, and IPC communication.
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isOk, isStarting, error, start, stop } = useSidecar();
 *
 *   return (
 *     <div>
 *       <p>Status: {isOk ? 'Running' : 'Stopped'}</p>
 *       <button onClick={start} disabled={isOk || isStarting}>Start API</button>
 *       <button onClick={stop} disabled={!isOk}>Stop API</button>
 *       {error && <p>Error: {error}</p>}
 *     </div>
 *   );
 * }
 * ```
 *
 * @returns An object containing the API state and control methods
 */
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

  /**
   * @returns {Object} The sidecar API state and control methods
   */
  return {
    /** @type {ServerStatus} Current status of the API sidecar */
    status,

    /** @type {number|null} Port number the API is running on, or null if not running */
    port,

    /** @type {string|null} Error message if an error occurred, or null if no error */
    error,

    /** @type {boolean} Whether the API is currently loading/processing a request */
    isLoading,

    /** @type {boolean} Whether the API is in an error state */
    isError: isError(status),

    /** @type {boolean} Whether the API is running and ready to accept requests */
    isOk: isOk(status),

    /** @type {boolean} Whether the API is in the process of starting */
    isStarting: isStarting(status),

    /** @type {boolean} Whether the API is stopped (not running) */
    isStopped: isStopped(status),

    /** @type {boolean} Whether the API is in the process of stopping */
    isStopping: isStopping(status),

    /** @type {string} Human-readable status message for display */
    statusDisplay: getStatusDisplay(),

    /**
     * Start the API sidecar
     * @returns {Promise<number>} A promise that resolves to the port number when the API is started
     * @throws {Error} If the API fails to start
     */
    start,

    /**
     * Stop the API sidecar
     * @returns {Promise<void>} A promise that resolves when the API is stopped
     * @throws {Error} If the API fails to stop
     */
    stop,

    /**
     * Restart the API sidecar
     * @returns {Promise<number>} A promise that resolves to the port number when the API is restarted
     * @throws {Error} If the API fails to restart
     */
    restart,

    /**
     * Manually update the server status
     * This is called automatically on an interval, but can be called manually if needed
     */
    updateServerStatus,
  };
}
