type Props = {
  isLoading: boolean;
  isReady: boolean;
  error: string | null;
};

const getStatusColor = (isLoading: boolean, isReady: boolean): string => {
  if (isLoading) return "bg-yellow-500 animate-pulse";
  if (isReady) return "bg-green-500";
  return "bg-red-500";
};

const getStatusBgColor = (isLoading: boolean, isReady: boolean): string => {
  if (isLoading) return "bg-yellow-50 border-yellow-200";
  if (isReady) return "bg-green-50 border-green-200";
  return "bg-red-50 border-red-200";
};

const getStatusText = (isLoading: boolean, isReady: boolean, error: string | null): string => {
  if (isLoading) return "Starting API sidecar...";
  if (isReady) return "API sidecar is ready";
  return `Error: ${error}`;
};

const getStatusIcon = (isLoading: boolean, isReady: boolean) => {
  if (isLoading) {
    return (
      <svg className="h-5 w-5 animate-spin text-yellow-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );
  }

  if (isReady) {
    return (
      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
      </svg>
    );
  }

  return (
    <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      ></path>
    </svg>
  );
};

export function StatusIndicator({ isLoading, isReady, error }: Props) {
  return (
    <div className={`mb-4 rounded-lg border p-4 shadow-sm ${getStatusBgColor(isLoading, isReady)}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon(isLoading, isReady)}
        <div>
          <div className="flex items-center">
            <div className={`mr-2 h-2.5 w-2.5 rounded-full ${getStatusColor(isLoading, isReady)}`} />
            <span className="font-medium text-gray-800">{getStatusText(isLoading, isReady, error)}</span>
          </div>
          {isReady && (
            <p className="mt-1 text-sm text-gray-600">
              The API sidecar is running and ready to accept requests.
            </p>
          )}
          {isLoading && (
            <p className="mt-1 text-sm text-gray-600">
              Please wait while the API sidecar is starting...
            </p>
          )}
          {!isReady && !isLoading && error && (
            <p className="mt-1 text-sm text-red-600">{error}</p>
          )}
        </div>
      </div>
    </div>
  );
}
