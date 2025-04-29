import { isDevelopment } from "@common/utils";
import { Console } from "@renderer/features/console/Console";
import { ErrorBoundaryWithConsole } from "@renderer/features/console/ErrorBoundaryWithConsole";
import { useApiSidecar } from "@renderer/hooks/useApiSidecar";
import { useErrorBoundary } from "react-error-boundary";

/**
 * Main application content that will be wrapped in an error boundary
 */
const MainContent = () => {
  const { isReady, isLoading, error } = useApiSidecar();
  const { showBoundary } = useErrorBoundary();

  return (
    <div className="flex-1 overflow-auto p-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Electron FastAPI Sidecar</h1>
        </div>

        <div>{isReady && <p>API is ready</p>}</div>
        <div>{isLoading && <p>API is loading</p>}</div>
        <div>{error && <p>API is error</p>}</div>

        {isDevelopment() && (
          <button
            onClick={() => showBoundary(new Error("Test error from button click"))}
            className="bg-red-500 text-white p-2 rounded"
          >
            Throw error
          </button>
        )}

        <div className="mt-6 rounded-lg bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">API Interaction</h2>
          <p className="text-gray-600">
            This application demonstrates how to integrate Electron with a FastAPI Python backend.
            Use the buttons above to interact with the API and see the logs below.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * Main App component that wraps content in error boundary but keeps console outside
 */
export const App = () => {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-gray-50">
      {/* Main Content with Error Boundary */}
      <ErrorBoundaryWithConsole>
        <MainContent />
      </ErrorBoundaryWithConsole>

      {/* Console is outside the error boundary */}
      {isDevelopment() && <Console />}
    </div>
  );
};
