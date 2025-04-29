import { useConsole } from "@renderer/features/console/ConsoleContext";
import { logger } from "@renderer/features/console/logger";
import { useEffect, useRef, useState } from "react";

export function useApiSidecar() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pushLog } = useConsole();
  const hasStartedRef = useRef(false);

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const startSidecar = async () => {
      try {
        logger.info("Starting API sidecar...");

        await window.api.startApiSidecar();

        logger.info("API sidecar process started");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";

        logger.error(
          `Error starting API sidecar: ${errorMessage}`,
          err instanceof Error ? err : undefined
        );

        setError(errorMessage);
        hasStartedRef.current = false;
      }
    };

    const handleApiReady = (port: number) => {
      logger.info(`API sidecar is ready on port ${port}`);

      setIsReady(true);
      setIsLoading(false);
      setError(null);
    };

    const handleApiExit = (exitCode: number) => {
      logger.error(`API process exited with code ${exitCode}`);

      setIsReady(false);
      setError(`API process exited with code ${exitCode}`);
      hasStartedRef.current = false;
    };

    startSidecar();

    const readyCleanup = window.api.onApiReady(handleApiReady);
    const exitCleanup = window.api.onApiProcessExit(handleApiExit);

    return () => {
      readyCleanup();
      exitCleanup();
    };
  }, [pushLog]);

  return { isReady, isLoading, error };
}
